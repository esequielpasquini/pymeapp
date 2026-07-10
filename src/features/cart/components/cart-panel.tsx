"use client";

import { useState, useTransition } from "react";
import { ShoppingCart, X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart, getItemPrice } from "@/features/cart/context";
import { confirmSale } from "@/features/cart/actions";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Reemplazo de la calculadora de mostrador (modulo "compras", ver
 * features/modules). Tab lateral flotante siempre visible (colapsado) que
 * se despliega en un panel con el detalle y el total.
 *
 * El bug de corrupcion visual (tearing) en tablet Android que hizo sacar
 * este tab en una version anterior en realidad NO era por el tab -- se
 * confirmo despues (sacandolo y el problema seguia) que la causa real era
 * un icono en AddToCartButton repetido en cada fila de la lista de
 * resultados. Con ese boton sin icono, el tab flotante es seguro.
 */
export function CartPanel() {
  const cart = useCart();
  const [isConfirming, startConfirm] = useTransition();
  const [confirmError, setConfirmError] = useState<string | null>(null);

  if (!cart) return null;

  const { items, total, itemCount, isOpen, setIsOpen, updateQuantity, toggleFractioned, removeItem, clear } =
    cart;

  function handleConfirm() {
    setConfirmError(null);
    startConfirm(async () => {
      const result = await confirmSale(
        items.map((item) => ({
          productId: item.productId,
          description: item.description,
          brand: item.brand,
          unitPrice: getItemPrice(item),
          fractioned: item.fractioned,
          quantity: item.quantity,
        }))
      );
      if (result.error) {
        setConfirmError(result.error);
      } else {
        clear();
        setIsOpen(false);
      }
    });
  }

  return (
    <>
      {/* Tab colapsado, siempre montado (a diferencia del backdrop/panel de
          abajo, que solo existen mientras isOpen). Anima "right" en vez de
          "transform: translateX" -- no hacia falta para el bug real, pero
          ya estaba probado y funciona bien. */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-1 rounded-l-xl border border-r-0 border-primary bg-primary px-2.5 py-3 text-primary-foreground shadow-lg transition-[right] duration-200",
          isOpen ? "pointer-events-none right-[-100px]" : "right-0"
        )}
        aria-label="Ver compras"
      >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-primary">
            {itemCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar compras"
            className="fixed inset-0 z-20 bg-black/30"
          />

          <div className="fixed inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">Compras</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Todavía no agregaste productos. Buscá uno y tocá &quot;Agregar&quot;.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 text-sm font-medium leading-snug">
                      {item.brand ? `${item.brand} — ` : ""}
                      {item.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="Quitar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {item.unitPrice !== null && item.kiloPrice !== null && (
                    <button
                      type="button"
                      onClick={() => toggleFractioned(item.productId)}
                      className={cn(
                        "mt-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                        item.fractioned
                          ? "bg-red-600 text-white"
                          : "border border-red-600 text-red-600"
                      )}
                    >
                      Fraccionado
                    </button>
                  )}

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - (item.fractioned ? 0.5 : 1))
                        }
                        aria-label="Restar"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        step={item.fractioned ? "0.5" : "1"}
                        min="0"
                        onChange={(e) => updateQuantity(item.productId, Number(e.target.value) || 0)}
                        className="h-8 w-16 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + (item.fractioned ? 0.5 : 1))
                        }
                        aria-label="Sumar"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">
                      {formatCurrency(getItemPrice(item) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-3 border-t border-border p-4">
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 px-4 py-3">
              <span className="font-medium">Total</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
            </div>
            {confirmError && <p className="text-sm text-destructive">{confirmError}</p>}
            <div className="flex gap-2">
              <Button type="button" onClick={handleConfirm} disabled={isConfirming} className="flex-1">
                {isConfirming ? "Guardando..." : "Confirmar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clear}
                disabled={isConfirming}
                className="text-muted-foreground"
              >
                Vaciar
              </Button>
            </div>
          </div>
        )}
          </div>
        </>
      )}
    </>
  );
}
