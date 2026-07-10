"use client";

import { WhatsAppIcon } from "@/features/products/components/whatsapp-share-button";
import type { OrderDetail } from "@/features/orders/queries";

/**
 * Mismo criterio que WhatsAppShareButton de productos: el mensaje que arma
 * este boton es literalmente lo que el dueño le manda al proveedor.
 */
function buildOrderMessage(order: OrderDetail): string {
  const lines = [`Pedido para ${order.supplier_name}:`, ""];
  for (const item of order.items) {
    const name = item.brand ? `${item.brand} - ${item.description}` : item.description;
    lines.push(`- ${name}: ${item.quantity}`);
  }
  return lines.join("\n");
}

export function OrderWhatsAppButton({ order }: { order: OrderDetail }) {
  function handleShare() {
    const message = buildOrderMessage(order);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-md border border-green-600 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50"
    >
      <WhatsAppIcon className="h-4 w-4" />
      Exportar a WhatsApp
    </button>
  );
}
