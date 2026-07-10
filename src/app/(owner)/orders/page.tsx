import Link from "next/link";
import { redirect } from "next/navigation";
import { getEnabledModules, MODULE_PEDIDOS } from "@/features/modules/queries";
import { listOrders } from "@/features/orders/queries";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { Button } from "@/components/ui/button";

export default async function OrdersPage() {
  const enabledModules = await getEnabledModules();
  if (!enabledModules.has(MODULE_PEDIDOS)) redirect("/dashboard");

  const orders = await listOrders();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pedidos</h1>
          <p className="text-sm text-muted-foreground">Pedidos de compra a proveedores.</p>
        </div>
        <Button asChild>
          <Link href="/orders/new">Nuevo pedido</Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Todavia no armaste ningun pedido.</p>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50 md:px-5 md:py-3.5"
            >
              <div className="min-w-0">
                <p className="truncate font-medium md:text-lg">{order.supplier_name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                  {" · "}
                  {order.item_count} producto{order.item_count === 1 ? "" : "s"}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
