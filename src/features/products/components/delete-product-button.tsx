"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/features/products/actions";

/**
 * Boton de "eliminar producto" en la ficha del dueño. En rigor es un
 * soft-delete (ver deleteProduct) -- el producto deja de verse en los
 * listados pero el historial de precios se conserva.
 */
export function DeleteProductButton({ productId, description }: { productId: string; description: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `¿Eliminar "${description}"? Vas a dejar de verlo en el listado y en el buscador del empleado. El historial de precios se conserva.`
    );
    if (!confirmed) return;

    startTransition(() => {
      deleteProduct(productId);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="gap-2 text-destructive hover:bg-destructive/10"
      onClick={handleClick}
      disabled={isPending}
    >
      <Trash2 className="h-4 w-4" />
      {isPending ? "Eliminando..." : "Eliminar producto"}
    </Button>
  );
}
