"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { setFlash } from "@/lib/flash";
import { deleteSheet, saveSheet } from "@/features/finanzas/actions";
import { formatPesos, parsePesos } from "@/features/finanzas/money";
import { formatDayLong } from "@/features/finanzas/dates";
import type { DailySheet, SheetPaymentMethod } from "@/features/finanzas/types";

type Row = { key: string; amount: string; method: SheetPaymentMethod; needsReview: boolean };

let rowCounter = 0;
const newKey = () => `row-${++rowCounter}`;

function toInput(value: number | null): string {
  return value === null ? "" : value.toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

/**
 * Revision de una hoja del cuaderno: foto a la izquierda (arriba en el
 * celular) y lo que leyo la IA a la derecha, editable. Cada monto se puede
 * corregir, pasar de efectivo a transferencia (y al reves), borrar, o
 * agregar uno que la IA no vio. Los montos dudosos para la IA aparecen
 * resaltados.
 */
export function SheetEditor({ sheet }: { sheet: DailySheet }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sheetDate, setSheetDate] = useState(sheet.sheet_date ?? "");
  const [openingCash, setOpeningCash] = useState(toInput(sheet.opening_cash));
  const [rows, setRows] = useState<Row[]>(() =>
    sheet.entries.map((e) => ({
      key: newKey(),
      amount: toInput(e.amount),
      method: e.payment_method,
      needsReview: e.needs_review,
    }))
  );
  const inputRefs = useRef(new Map<string, HTMLInputElement>());
  const confirmed = sheet.status === "confirmada";

  const totals = useMemo(() => {
    let cash = 0;
    let transfers = 0;
    let invalid = 0;
    for (const row of rows) {
      const value = parsePesos(row.amount);
      if (value === null) invalid += 1;
      else if (row.method === "transferencia") transfers += value;
      else cash += value;
    }
    return { cash, transfers, total: cash + transfers, invalid };
  }, [rows]);

  const reviewCount = rows.filter((r) => r.needsReview).length;

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow(afterKey?: string) {
    const row: Row = { key: newKey(), amount: "", method: "efectivo", needsReview: false };
    setRows((prev) => {
      const index = afterKey ? prev.findIndex((r) => r.key === afterKey) : -1;
      if (index === -1) return [...prev, row];
      return [...prev.slice(0, index + 1), row, ...prev.slice(index + 1)];
    });
    requestAnimationFrame(() => inputRefs.current.get(row.key)?.focus());
  }

  function submit(confirm: boolean) {
    setError(null);
    if (totals.invalid > 0) {
      setError("Hay montos vacíos o inválidos. Corregilos o borralos.");
      return;
    }
    const opening = openingCash.trim() === "" ? null : parsePesos(openingCash);
    if (openingCash.trim() !== "" && opening === null) {
      setError("El inicio de caja no es un monto válido.");
      return;
    }
    startTransition(async () => {
      const result = await saveSheet(
        sheet.id,
        {
          sheetDate: sheetDate || null,
          openingCash: opening,
          entries: rows.map((r) => ({ amount: parsePesos(r.amount) ?? 0, payment_method: r.method })),
        },
        confirm
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setFlash(confirm || confirmed ? "Hoja guardada" : "Borrador guardado");
      router.push("/finanzas/planillas");
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm("¿Borrar esta hoja y su foto? No se puede deshacer.")) return;
    startTransition(async () => {
      const result = await deleteSheet(sheet.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setFlash("Hoja borrada");
      router.push("/finanzas/planillas");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="lg:sticky lg:top-4 lg:self-start">
        {sheet.photo_url ? (
          <a href={sheet.photo_url} target="_blank" rel="noreferrer" title="Abrir la foto en grande">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de storage privado, no pasa por next/image */}
            <img
              src={sheet.photo_url}
              alt="Foto de la hoja del cuaderno"
              className="max-h-[80vh] w-full rounded-lg border border-border object-contain"
            />
          </a>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            Hoja cargada a mano, sin foto.
          </div>
        )}
      </div>

      <div className="space-y-5">
        {sheet.ai_error && (
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">{sheet.ai_error}</p>
        )}
        {reviewCount > 0 && (
          <p className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            La IA no está segura de {reviewCount === 1 ? "1 monto" : `${reviewCount} montos`}: están resaltados.
            Compará con la foto.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="sheetDate">Fecha</Label>
            <Input id="sheetDate" type="date" value={sheetDate} onChange={(e) => setSheetDate(e.target.value)} />
            {sheetDate && <p className="text-xs text-muted-foreground">{formatDayLong(sheetDate)}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="openingCash">Inicio de caja</Label>
            <Input
              id="openingCash"
              inputMode="decimal"
              placeholder="30.000"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">No suma como venta.</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Ventas ({rows.length})</h2>
            <p className="text-xs text-muted-foreground">Encerrado en el cuaderno = transferencia</p>
          </div>

          {rows.length === 0 && (
            <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No hay montos cargados. Agregalos con el botón de abajo.
            </p>
          )}

          <ol className="space-y-1.5">
            {rows.map((row, index) => {
              const invalid = row.amount.trim() !== "" && parsePesos(row.amount) === null;
              return (
                <li
                  key={row.key}
                  className={cn(
                    "flex items-center gap-2 rounded-md p-1",
                    row.needsReview && "bg-amber-50 ring-1 ring-amber-300"
                  )}
                >
                  <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">{index + 1}</span>
                  <Input
                    ref={(el) => {
                      if (el) inputRefs.current.set(row.key, el);
                      else inputRefs.current.delete(row.key);
                    }}
                    inputMode="decimal"
                    aria-label={`Monto ${index + 1}`}
                    value={row.amount}
                    onChange={(e) => updateRow(row.key, { amount: e.target.value, needsReview: false })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addRow(row.key);
                      }
                    }}
                    className={cn("h-9 min-w-0 flex-1 text-right tabular-nums", invalid && "border-destructive")}
                  />
                  <div className="flex shrink-0 overflow-hidden rounded-md border border-border text-xs">
                    {(["efectivo", "transferencia"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => updateRow(row.key, { method, needsReview: false })}
                        className={cn(
                          "px-2 py-2 font-medium transition-colors sm:px-3",
                          row.method === method
                            ? method === "transferencia"
                              ? "bg-blue-600 text-white"
                              : "bg-green-600 text-white"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {method === "efectivo" ? "Efectivo" : "Transf."}
                      </button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Borrar monto ${index + 1}`}
                    onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ol>

          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => addRow()}>
            <Plus className="h-4 w-4" /> Agregar monto
          </Button>
        </div>

        <dl className="grid grid-cols-3 gap-2 rounded-lg border border-border p-3 text-center">
          <div>
            <dt className="text-xs text-muted-foreground">Efectivo</dt>
            <dd className="font-semibold tabular-nums">{formatPesos(totals.cash)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Transferencias</dt>
            <dd className="font-semibold tabular-nums">{formatPesos(totals.transfers)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Total del día</dt>
            <dd className="font-semibold tabular-nums">{formatPesos(totals.total)}</dd>
          </div>
        </dl>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap items-center gap-2">
          {confirmed ? (
            <Button type="button" onClick={() => submit(false)} disabled={pending}>
              Guardar cambios
            </Button>
          ) : (
            <>
              <Button type="button" onClick={() => submit(true)} disabled={pending}>
                Confirmar hoja
              </Button>
              <Button type="button" variant="outline" onClick={() => submit(false)} disabled={pending}>
                Guardar borrador
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            className="ml-auto text-muted-foreground hover:text-destructive"
            onClick={remove}
            disabled={pending}
          >
            Borrar hoja
          </Button>
        </div>
        {!confirmed && (
          <p className="text-xs text-muted-foreground">Solo las hojas confirmadas cuentan en los resultados.</p>
        )}
      </div>
    </div>
  );
}
