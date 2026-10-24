"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { findSaleProducts, registerSale } from "@/features/sales/actions";
import {
  PAYMENT_METHODS,
  lineTotal,
  linePrice,
  roundMoney,
  type PaymentMethod,
  type SaleLine,
  type SaleProduct,
} from "@/features/sales/types";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "venta-en-curso-v1";

function parseAmount(value: string): number | null {
  const clean = value.trim().replace(/\$/g, "").replace(/\s/g, "");
  if (clean === "") return null;
  // "1.500,50" (es-AR) o "1500.5": si hay coma, el punto es separador de miles.
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function formatQuantity(line: SaleLine): string {
  return line.fractioned
    ? line.quantity.toLocaleString("es-AR", { maximumFractionDigits: 3 })
    : String(line.quantity);
}

/** Montos "redondos" por encima del total para pagar en efectivo con un
 * toque (ej. total 7.350 -> 8.000, 10.000, 20.000). */
function quickCashAmounts(total: number): number[] {
  if (total <= 0) return [];
  const steps = [1000, 2000, 5000, 10000, 20000];
  const amounts = new Set<number>();
  for (const step of steps) {
    const amount = Math.ceil(total / step) * step;
    if (amount > total) amounts.add(amount);
    if (amounts.size >= 3) break;
  }
  return Array.from(amounts).sort((a, b) => a - b);
}

/**
 * Pantalla de venta (modulo "ventas"): se escanea (o se busca por nombre)
 * cada producto y se va armando la venta; los fraccionados piden la
 * cantidad en kg al agregarlos. Al final se elige el metodo de pago y, si
 * es efectivo, se calcula el vuelto.
 *
 * Todo pensado para usarse con teclado + lector sin tocar el mouse: el foco
 * vuelve solo al campo de escaneo despues de cada accion, Enter confirma la
 * cantidad, flechas eligen de la lista de coincidencias.
 *
 * Sin iconos en las lineas de la venta a proposito (ver AddToCartButton:
 * iconos repetidos por fila causaban tearing en una tablet Android).
 */
export function SellView() {
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SaleProduct[]>([]);
  const [highlighted, setHighlighted] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [cashInput, setCashInput] = useState("");
  const [saleError, setSaleError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<{ total: number; change: number | null } | null>(null);
  const [isRegistering, startRegister] = useTransition();
  const [recentKey, setRecentKey] = useState<string | null>(null);

  const scanRef = useRef<HTMLInputElement>(null);
  const qtyRefs = useRef(new Map<string, HTMLInputElement>());
  const searchSeq = useRef(0);
  // addProduct puede correr despues de un await (lookup): lee las lineas
  // actuales de aca, no las del render en que se escaneo.
  const linesRef = useRef(lines);
  linesRef.current = lines;

  const focusScan = useCallback(() => {
    requestAnimationFrame(() => scanRef.current?.focus());
  }, []);

  // Venta en curso persistida en el dispositivo: si se recarga la pagina o
  // se cierra la pestaña por error, no se pierde lo escaneado.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines(parsed as SaleLine[]);
      }
    } catch {
      // localStorage bloqueado o corrupto: arranca vacia.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // No critico.
    }
  }, [lines, hydrated]);

  const total = useMemo(() => roundMoney(lines.reduce((sum, line) => sum + lineTotal(line), 0)), [lines]);
  const cashPaid = parseAmount(cashInput);
  const change = paymentMethod === "efectivo" && cashPaid !== null ? roundMoney(cashPaid - total) : null;
  const cashShort = paymentMethod === "efectivo" && (cashPaid === null || cashPaid < total);
  const canCharge = lines.length > 0 && total > 0 && !cashShort && !isRegistering;

  function flash(key: string) {
    setRecentKey(key);
    setTimeout(() => setRecentKey((k) => (k === key ? null : k)), 900);
  }

  function addProduct(product: SaleProduct) {
    setSuggestions([]);
    setScanError(null);
    setLastSale(null);

    if (product.unit_price === null && product.price_per_kilo === null) {
      setScanError(`"${product.description}" no tiene precio cargado.`);
      focusScan();
      return;
    }

    // Si solo tiene precio por kilo, va fraccionado; si tiene los dos,
    // arranca por unidad (se puede cambiar en la linea).
    const fractioned = product.unit_price === null;
    const existing = linesRef.current.find((line) => line.productId === product.id && line.fractioned === fractioned);

    if (existing && !fractioned) {
      setLines((prev) => prev.map((l) => (l.key === existing.key ? { ...l, quantity: l.quantity + 1 } : l)));
      flash(existing.key);
      focusScan();
      return;
    }
    if (existing && fractioned) {
      // Volver a escanear un fraccionado: se corrige el peso de la misma
      // linea en vez de duplicarla.
      focusQuantity(existing.key);
      return;
    }

    const key = `${product.id}-${Date.now()}`;
    const line: SaleLine = {
      key,
      productId: product.id,
      brand: product.brand,
      description: product.description,
      unitPrice: product.unit_price,
      kiloPrice: product.price_per_kilo,
      fractioned,
      quantity: 1,
    };
    setLines((prev) => [line, ...prev]);
    flash(key);
    if (fractioned) focusQuantity(key);
    else focusScan();
  }

  function focusQuantity(key: string) {
    // Despues del render que agrega la linea.
    setTimeout(() => {
      const input = qtyRefs.current.get(key);
      input?.focus();
      input?.select();
    }, 0);
  }

  // Sugerencias mientras se tipea un nombre. searchSeq descarta respuestas
  // viejas (se tipeo algo mas mientras tanto).
  async function suggest(term: string) {
    const seq = ++searchSeq.current;
    try {
      const { products } = await findSaleProducts(term);
      if (seq !== searchSeq.current) return;
      setSuggestions(products);
      setHighlighted(0);
    } catch {
      // Las sugerencias no son criticas.
    }
  }

  // Enter del lector (o de un codigo tipeado): busca y agrega. A diferencia
  // de suggest() NUNCA se descarta -- con escaneos seguidos cada lectura
  // tiene que terminar en su producto. Si hay varias coincidencias, se
  // muestran para elegir.
  async function scan(term: string) {
    searchSeq.current++; // cancela sugerencias pendientes
    setIsSearching(true);
    setScanError(null);
    try {
      const { products } = await findSaleProducts(term);
      if (products.length === 1) {
        addProduct(products[0]);
      } else if (products.length === 0) {
        setScanError(`No se encontró "${term}".`);
      } else {
        setSuggestions(products);
        setHighlighted(0);
      }
    } catch {
      setScanError("No se pudo buscar. Revisá la conexión.");
    } finally {
      setIsSearching(false);
    }
  }

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(() => suggest(term), 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function handleScanKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setQuery("");
      setSuggestions([]);
      setScanError(null);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const term = query.trim();
      if (!term) return;
      // Si la lista de coincidencias ya esta a la vista y el termino no
      // tiene forma de codigo, Enter elige la resaltada. Si no (lector),
      // se busca en el momento por codigo exacto.
      const looksLikeCode = /^[0-9A-Za-z-]+$/.test(term) && /\d/.test(term);
      // El cuadro se vacia ya (no al volver la respuesta), asi el proximo
      // escaneo no se mezcla con este.
      setQuery("");
      if (suggestions.length > 0 && !looksLikeCode) {
        addProduct(suggestions[highlighted] ?? suggestions[0]);
      } else {
        scan(term);
      }
    }
  }

  function setQuantity(key: string, raw: string) {
    const value = parseAmount(raw);
    setLines((prev) =>
      prev.flatMap((line) => {
        if (line.key !== key) return [line];
        if (value === null) return [line];
        const quantity = line.fractioned ? Math.round(value * 1000) / 1000 : Math.round(value);
        return quantity <= 0 ? [] : [{ ...line, quantity }];
      })
    );
  }

  function stepQuantity(key: string, delta: number) {
    setLines((prev) =>
      prev.flatMap((line) => {
        if (line.key !== key) return [line];
        const quantity = line.quantity + delta;
        return quantity <= 0 ? [] : [{ ...line, quantity }];
      })
    );
  }

  function toggleMode(key: string) {
    setLines((prev) =>
      prev.map((line) =>
        line.key === key && line.unitPrice !== null && line.kiloPrice !== null
          ? { ...line, fractioned: !line.fractioned, quantity: 1 }
          : line
      )
    );
    focusQuantity(key);
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((line) => line.key !== key));
    focusScan();
  }

  function cancelSale() {
    if (lines.length > 0 && !window.confirm("¿Cancelar la venta en curso?")) return;
    setLines([]);
    setCashInput("");
    setSaleError(null);
    focusScan();
  }

  function charge() {
    if (!canCharge) return;
    setSaleError(null);
    startRegister(async () => {
      const result = await registerSale({
        items: lines.map((line) => ({
          productId: line.productId,
          brand: line.brand,
          description: line.description,
          unitPrice: linePrice(line),
          fractioned: line.fractioned,
          quantity: line.quantity,
        })),
        paymentMethod,
        amountPaid: paymentMethod === "efectivo" ? cashPaid : null,
      });
      if (result.error) {
        setSaleError(result.error);
        return;
      }
      setLastSale({ total: result.total ?? total, change: result.change ?? null });
      setLines([]);
      setCashInput("");
      setPaymentMethod("efectivo");
      focusScan();
    });
  }

  // F9 cobra desde cualquier lado (atajo de caja), sin soltar el lector.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "F9") {
        e.preventDefault();
        charge();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const quickAmounts = quickCashAmounts(total);

  return (
    <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-3">
        <div className="relative">
          <Input
            ref={scanRef}
            autoFocus
            autoComplete="off"
            enterKeyHint="go"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setScanError(null);
            }}
            onKeyDown={handleScanKeyDown}
            placeholder="Escaneá o escribí el producto..."
            className="h-14 text-lg"
          />
          {isSearching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Buscando...</span>
          )}

          {suggestions.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-background shadow-lg">
              {suggestions.map((product, i) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setQuery("");
                      addProduct(product);
                    }}
                    onMouseEnter={() => setHighlighted(i)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left",
                      i === highlighted && "bg-muted"
                    )}
                  >
                    <span className="min-w-0">
                      {product.brand && (
                        <span className="block truncate text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {product.brand}
                        </span>
                      )}
                      <span className="block truncate font-medium">{product.description}</span>
                    </span>
                    <span className="shrink-0 text-right text-sm tabular-nums">
                      {product.unit_price !== null && <span className="block font-semibold">{formatCurrency(product.unit_price)}</span>}
                      {product.price_per_kilo !== null && (
                        <span className="block text-xs text-muted-foreground">{formatCurrency(product.price_per_kilo)} / kg</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {scanError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{scanError}</p>}
        {lastSale && lines.length === 0 && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
            <p className="font-semibold">Venta registrada · {formatCurrency(lastSale.total)}</p>
            {lastSale.change !== null && (
              <p className="text-2xl font-bold tabular-nums">Vuelto: {formatCurrency(lastSale.change)}</p>
            )}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-border">
          {lines.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              Escaneá un producto para empezar la venta.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {lines.map((line) => (
                <li
                  key={line.key}
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 px-3 py-3 transition-colors md:px-4 lg:grid-cols-[minmax(0,1fr)_auto_7rem_auto] lg:items-center",
                    recentKey === line.key && "bg-primary/5"
                  )}
                >
                  <div className="min-w-0">
                    {line.brand && (
                      <p className="truncate text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {line.brand}
                      </p>
                    )}
                    <p className="line-clamp-2 font-semibold leading-snug">{line.description}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {formatCurrency(linePrice(line))} {line.fractioned ? "/ kg" : "c/u"}
                      {line.unitPrice !== null && line.kiloPrice !== null && (
                        <button
                          type="button"
                          onClick={() => toggleMode(line.key)}
                          className="ml-2 rounded border border-border px-1.5 py-0.5 font-medium text-foreground hover:bg-muted"
                        >
                          {line.fractioned ? "Vender por unidad" : "Vender por kg"}
                        </button>
                      )}
                    </p>
                  </div>

                  <p className="self-start text-right text-lg font-bold tabular-nums lg:order-3 lg:self-center">
                    {formatCurrency(lineTotal(line))}
                  </p>

                  <div className="col-span-2 flex items-center gap-1.5 lg:order-2 lg:col-span-1">
                    {!line.fractioned && (
                      <Button type="button" variant="outline" className="h-9 w-9 p-0 text-lg" onClick={() => stepQuantity(line.key, -1)} aria-label="Restar uno">
                        −
                      </Button>
                    )}
                    <QuantityInput
                      line={line}
                      inputRef={(el) => {
                        if (el) qtyRefs.current.set(line.key, el);
                        else qtyRefs.current.delete(line.key);
                      }}
                      onCommit={(raw) => setQuantity(line.key, raw)}
                      onDone={focusScan}
                      onScan={(code) => {
                        focusScan();
                        scan(code);
                      }}
                    />
                    {line.fractioned ? (
                      <span className="text-sm text-muted-foreground">kg</span>
                    ) : (
                      <Button type="button" variant="outline" className="h-9 w-9 p-0 text-lg" onClick={() => stepQuantity(line.key, 1)} aria-label="Sumar uno">
                        +
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="ml-auto rounded px-2 py-1 text-sm text-muted-foreground hover:bg-red-50 hover:text-red-700 lg:hidden"
                    >
                      Quitar
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    className="hidden rounded px-2 py-1 text-sm text-muted-foreground hover:bg-red-50 hover:text-red-700 lg:order-4 lg:block"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <aside className="space-y-4 rounded-lg border border-border p-4 md:sticky md:top-20">
        <div>
          <p className="text-sm text-muted-foreground">
            Total · {lines.length} {lines.length === 1 ? "producto" : "productos"}
          </p>
          <p className="text-4xl font-bold tabular-nums md:text-3xl lg:text-4xl">{formatCurrency(total)}</p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Método de pago</p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value)}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
                  paymentMethod === method.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                )}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {paymentMethod === "efectivo" && (
          <div className="space-y-2">
            <label htmlFor="cash" className="text-sm font-medium">
              Paga con
            </label>
            <Input
              id="cash"
              inputMode="decimal"
              autoComplete="off"
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  charge();
                }
              }}
              placeholder="$ 0"
              className="h-12 text-xl tabular-nums"
            />
            {total > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCashInput(String(total))}
                  className="rounded-md border border-border px-2.5 py-1 text-sm hover:bg-muted"
                >
                  Justo
                </button>
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setCashInput(String(amount))}
                    className="rounded-md border border-border px-2.5 py-1 text-sm tabular-nums hover:bg-muted"
                  >
                    {formatCurrency(amount).replace(/,00$/, "")}
                  </button>
                ))}
              </div>
            )}
            {change !== null && total > 0 && (
              <div
                className={cn(
                  "rounded-lg px-4 py-3",
                  change >= 0 ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
                )}
              >
                <p className="text-sm font-medium">{change >= 0 ? "Vuelto" : "Falta"}</p>
                <p className="text-3xl font-bold tabular-nums">{formatCurrency(Math.abs(change))}</p>
              </div>
            )}
          </div>
        )}

        {saleError && <p className="text-sm text-destructive">{saleError}</p>}

        <div className="space-y-2">
          <Button type="button" onClick={charge} disabled={!canCharge} className="h-12 w-full text-base">
            {isRegistering ? "Registrando..." : `Cobrar ${total > 0 ? formatCurrency(total) : ""}`}
          </Button>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Atajo: F9 para cobrar</span>
            {lines.length > 0 && (
              <button type="button" onClick={cancelSale} className="hover:text-destructive">
                Cancelar venta
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/**
 * Cantidad editable como texto (no type=number): acepta coma decimal
 * ("0,750") y no cambia el valor con la rueda del mouse. Se confirma con
 * Enter o al salir del campo; Enter ademas devuelve el foco al escaneo.
 */
function QuantityInput({
  line,
  inputRef,
  onCommit,
  onDone,
  onScan,
}: {
  line: SaleLine;
  inputRef: (el: HTMLInputElement | null) => void;
  onCommit: (raw: string) => void;
  onDone: () => void;
  /** Se escaneo un producto con el foco aca (ej. no se cargo el peso del
   * anterior): el codigo NO es una cantidad, se manda a buscar. */
  onScan: (code: string) => void;
}) {
  const [draft, setDraft] = useState(formatQuantity(line));
  // Rafaga del lector: teclas a menos de 50 ms entre si (ver SearchBox).
  const burst = useRef({ text: "", lastAt: 0 });

  useEffect(() => {
    setDraft(formatQuantity(line));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.quantity, line.fractioned]);

  return (
    <Input
      ref={inputRef}
      inputMode={line.fractioned ? "decimal" : "numeric"}
      autoComplete="off"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => onCommit(draft)}
      onKeyDown={(e) => {
        const now = performance.now();
        if (e.key.length === 1) {
          burst.current.text = now - burst.current.lastAt > 50 ? e.key : burst.current.text + e.key;
          burst.current.lastAt = now;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const code = burst.current.text;
          burst.current.text = "";
          if (code.length >= 6 && now - burst.current.lastAt <= 100) {
            setDraft(formatQuantity(line));
            onScan(code);
            return;
          }
          onCommit(draft);
          onDone();
        } else if (e.key === "Escape") {
          setDraft(formatQuantity(line));
          onDone();
        }
      }}
      aria-label={line.fractioned ? "Peso en kg" : "Cantidad"}
      className={cn("h-9 text-center tabular-nums", line.fractioned ? "w-24" : "w-14")}
    />
  );
}
