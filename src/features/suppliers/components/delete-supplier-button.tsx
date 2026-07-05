"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteSupplier } from "@/features/suppliers/actions";
import type { Supplier } from "@/lib/supabase/types";

/**
 * Eliminar un proveedor es un DELETE real (ver deleteSupplier) -- los
 * productos que lo tenian asignado no se borran ni se ocultan, quedan como
 * "Sin proveedor" (supplier_id es on delete set null). Se avisa eso mismo en
 * la confirmacion para que el dueño no piense que va a perder productos.
 */
export function DeleteSupplierButton({
  supplier,
  onDeleted,
}: {
  supplier: Supplier;
  onDeleted?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const productCount = supplier.product_count ?? 0;
    const productWarning =
      productCount > 0
        ? ` ${productCount} producto${productCount === 1 ? "" : "s"} quedaria${
            productCount === 1 ? "" : "n"
          } marcados como "Sin proveedor".`
        : "";
    const confirmed = window.confirm(`¿Eliminar el proveedor "${supplier.name}"?${productWarning}`);
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteSupplier(supplier.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      onDeleted?.();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 text-destructive hover:bg-destructive/10"
        onClick={handleClick}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" />
        {isPending ? "Eliminando..." : "Eliminar proveedor"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
