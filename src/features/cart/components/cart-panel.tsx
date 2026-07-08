"use client";

import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart, getItemPrice } from "@/features/cart/context";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Reemplazo de la calculadora de mostrador (modulo "compras", ver
 * features/modules). Se abre desde CartHeaderButton (adentro del header,
 * position: sticky) y muestra un panel con el detalle y el total.
 *
 * A proposito NO hay ningun tab flotante propio con position:fixed siempre
 * presente en pantalla -- eso es lo que causaba corrupcion visual (tearing)
 * al scrollear la lista de productos en tablets Android, confirmado
 * deshabilitando el modulo (el problema desaparecia por completo). El
 * backdrop y el panel siguen siendo fixed, pero solo se montan en el DOM
 * mientras isOpen=true, asi que durante el scroll normal (que es cuando
 * pasaba el problema) no hay ningun elemento fixed del carrito en pantalla.
 */
export function CartPanel() {
  const cart = useCart();
  if (!cart) return null;

  const { items, total, isOpen, setIsOpen, updateQuantity, toggleFractioned, removeItem, clear } = cart;

  if (!isOpen) return null;

  return (
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
            <Button type="button" variant="outline" onClick={clear} className="w-full text-muted-foreground">
              Vaciar
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
