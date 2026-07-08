"use client";

import { ShoppingCart, X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/features/cart/context";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Reemplazo de la calculadora de mostrador (modulo "compras", ver
 * features/modules). Un tab fijo del lado derecho siempre visible con la
 * cantidad de items, que se despliega en un panel con el detalle y el
 * total -- pensado para que el empleado vaya sumando productos mientras
 * atiende a un cliente sin perder de vista la busqueda de atras.
 */
export function CartPanel() {
  const cart = useCart();
  if (!cart) return null;

  const { items, total, itemCount, isOpen, setIsOpen, updateQuantity, removeItem, clear } = cart;

  return (
    <>
      {/*
        Nunca se desmonta -- se anima con opacidad, igual que el panel de
        abajo. Montar/desmontar un "fixed inset-0" via {isOpen && ...} le
        dejaba a Chrome Android una tile vieja en cache que reaparecia como
        un velo oscuro fantasma al scrollear la lista de productos (bug de
        compositor bastante conocido con overlays fixed que entran/salen del
        DOM). Con opacity + pointer-events el elemento queda siempre
        presente y el navegador nunca tiene que recomponer la capa de cero.
      */}
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        aria-label="Cerrar compras"
        tabIndex={isOpen ? 0 : -1}
        className={cn(
          "fixed inset-0 z-20 bg-black/30 transition-opacity duration-200",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Tab colapsado, siempre visible mientras el panel esta cerrado. */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed right-0 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-1 rounded-l-xl border border-r-0 border-primary bg-primary px-2.5 py-3 text-primary-foreground shadow-lg transition-transform",
          isOpen && "pointer-events-none translate-x-full"
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

      {/* Panel deslizable. */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-border bg-background shadow-2xl transition-transform duration-200",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
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
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        aria-label="Restar"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        step="1"
                        min="0"
                        onChange={(e) => updateQuantity(item.productId, Number(e.target.value) || 0)}
                        className="h-8 w-16 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        aria-label="Sumar"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">
                      {formatCurrency(item.unitPrice * item.quantity)}
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
