import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/features/orders/queries";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={status === "enviado" ? "success" : "warning"}>
      {status === "enviado" ? "Enviado" : "Pendiente"}
    </Badge>
  );
}
