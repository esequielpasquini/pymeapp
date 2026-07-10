import { notFound, redirect } from "next/navigation";
import { getEnabledModules, MODULE_PEDIDOS } from "@/features/modules/queries";
import { getOrder } from "@/features/orders/queries";
import { listProductsBySupplier } from "@/features/products/queries";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { OrderStatusActions } from "@/features/orders/components/order-status-actions";
import { OrderWhatsAppButton } from "@/features/orders/components/order-whatsapp-button";
import { DuplicateOrderButton } from "@/features/orders/components/duplicate-order-button";
import { OrderForm } from "@/features/orders/components/order-form";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Detalle de un pedido. Mientras esta "pendiente" se puede seguir editando
 * (OrderForm reusa el mismo formulario de cantidades que /orders/new); una
 * vez "enviado" queda como registro historico de solo lectura.
 */
export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const enabledModules = await getEnabledModules();
  if (!enabledModules.has(MODULE_PEDIDOS)) redirect("/dashboard");

  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const products = order.supplier_id ? await listProductsBySupplier(order.supplier_id) : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{order.supplier_name}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(order.created_at)}
            {order.sent_at && ` · Enviado el ${formatDate(order.sent_at)}`}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <OrderStatusActions orderId={order.id} status={order.status} />
        <OrderWhatsAppButton order={order} />
      </div>

      {order.status === "pendiente" ? (
        <OrderForm mode="edit" orderId={order.id} products={products} initialItems={order.items} />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-3.5">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="w-20 shrink-0 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground md:w-32 md:text-sm">
                  {item.brand || "—"}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium leading-snug text-foreground md:text-base">
                  {item.description}
                </span>
              </div>
              <span className="shrink-0 text-sm font-semibold">{item.quantity}</span>
            </div>
          ))}
        </div>
      )}

      <DuplicateOrderButton orderId={order.id} />
    </div>
  );
}
