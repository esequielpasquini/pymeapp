"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setOrderStatus } from "@/features/orders/actions";
import type { OrderStatus } from "@/features/orders/queries";

/**
 * Un solo boton que alterna entre pendiente <-> enviado. No hay mas estados
 * (ver check de status en 0019_orders.sql), asi que no hace falta un
 * selector -- el boton siguiente es siempre el opuesto del actual.
 */
export function OrderStatusActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const next: OrderStatus = status === "pendiente" ? "enviado" : "pendiente";
    startTransition(async () => {
      await setOrderStatus(orderId, next);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={status === "pendiente" ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "Guardando..." : status === "pendiente" ? "Marcar como enviado" : "Volver a pendiente"}
    </Button>
  );
}
