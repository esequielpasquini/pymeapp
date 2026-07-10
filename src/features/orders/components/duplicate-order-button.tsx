"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { duplicateOrder } from "@/features/orders/actions";

/**
 * "Un pedido puede armarse tomando como referencia un pedido ya realizado":
 * crea un pedido nuevo pendiente para el mismo proveedor, copiando los
 * items de este (ver duplicateOrder), y redirige ahi. Se llama directo
 * (no via <form action>) porque duplicateOrder redirige internamente.
 */
export function DuplicateOrderButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await duplicateOrder(orderId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div>
      <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
        {isPending ? "Creando..." : "Usar como base para un pedido nuevo"}
      </Button>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
