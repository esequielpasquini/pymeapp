"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createOrder, updateOrderItems, type OrderItemInput } from "@/features/orders/actions";
import type { OrderableProduct } from "@/features/products/queries";
import type { OrderItem } from "@/features/orders/queries";

type Row = { key: string; productId: string | null; brand: string | null; description: string };

/**
 * Filas del formulario: el catalogo activo del proveedor (cantidad en 0 por
 * default) mas cualquier item que el pedido ya tenia pero que ya no esta en
 * ese catalogo (producto dado de baja o reasignado a otro proveedor despues
 * de armado el pedido) -- asi no se pierde silenciosamente al editar.
 */
function buildRows(products: OrderableProduct[], initialItems: OrderItem[]): Row[] {
  const rows: Row[] = products.map((p) => ({ key: p.id, productId: p.id, brand: p.brand, description: p.description }));
  const knownIds = new Set(products.map((p) => p.id));
  for (const item of initialItems) {
    if (!item.product_id || !knownIds.has(item.product_id)) {
      rows.push({ key: item.id, productId: item.product_id, brand: item.brand, description: item.description });
    }
  }
  return rows;
}

/**
 * Formulario de cantidades por producto para armar o editar un pedido --
 * mismo lenguaje visual de fila que el listado de resultados (columnas
 * invisibles marca/descripcion) mas un stepper +/- por fila (igual criterio
 * que el carrito de compras). En modo "create" llama a createOrder (que
 * redirige al pedido nuevo); en "edit" llama a updateOrderItems y refresca
 * la pagina en el lugar.
 */
export function OrderForm({
  mode,
  supplierId,
  orderId,
  products,
  initialItems = [],
}: {
  mode: "create" | "edit";
  supplierId?: string;
  orderId?: string;
  products: OrderableProduct[];
  initialItems?: OrderItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const rows = buildRows(products, initialItems);
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialItems.map((item) => [item.product_id ?? item.id, item.quantity]))
  );

  function setQty(key: string, value: number) {
    setQuantities((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  }

  const itemCount = rows.filter((row) => (quantities[row.key] ?? 0) > 0).length;

  function handleSubmit() {
    setError(null);
    const items: OrderItemInput[] = rows.map((row) => ({
      productId: row.productId,
      brand: row.brand,
      description: row.description,
      quantity: quantities[row.key] ?? 0,
    }));

    startTransition(async () => {
      const result =
        mode === "create" ? await createOrder(supplierId as string, items) : await updateOrderItems(orderId as string, items);
      if (result?.error) {
        setError(result.error);
      } else if (mode === "edit") {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Este proveedor todavia no tiene productos cargados.
        </p>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {rows.map((row) => {
            const qty = quantities[row.key] ?? 0;
            return (
              <div key={row.key} className="flex items-center gap-3 px-4 py-3 md:px-5 md:py-3.5">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="w-20 shrink-0 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground md:w-32 md:text-sm">
                    {row.brand || "—"}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium leading-snug text-foreground md:text-base">
                    {row.description}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setQty(row.key, qty - 1)}
                    aria-label="Restar"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Input
                    type="number"
                    value={qty}
                    min="0"
                    onChange={(e) => setQty(row.key, Number(e.target.value) || 0)}
                    className="h-8 w-16 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setQty(row.key, qty + 1)}
                    aria-label="Sumar"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {itemCount} producto{itemCount === 1 ? "" : "s"} con cantidad
        </p>
        <Button type="button" onClick={handleSubmit} disabled={isPending || itemCount === 0}>
          {isPending ? "Guardando..." : mode === "create" ? "Crear pedido" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
