import "server-only";
import { createClient } from "@/lib/supabase/server";

export type OrderStatus = "pendiente" | "enviado";

export type OrderListItem = {
  id: string;
  supplier_name: string;
  status: OrderStatus;
  created_at: string;
  sent_at: string | null;
  item_count: number;
};

export type OrderItem = {
  id: string;
  product_id: string | null;
  brand: string | null;
  description: string;
  quantity: number;
};

export type OrderDetail = {
  id: string;
  supplier_id: string | null;
  supplier_name: string;
  status: OrderStatus;
  created_at: string;
  sent_at: string | null;
  items: OrderItem[];
};

/**
 * Listado de pedidos de la organizacion, mas nuevo primero (ver
 * orders_org_idx en 0019_orders.sql). item_count via el embed de PostgREST
 * (order_items(count)), mismo patron que listSuppliersWithCounts.
 */
export async function listOrders(): Promise<OrderListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, supplier_name, status, created_at, sent_at, order_items(count)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const itemsField = row.order_items as unknown as { count: number }[] | null;
    return {
      id: row.id,
      supplier_name: row.supplier_name,
      status: row.status as OrderStatus,
      created_at: row.created_at,
      sent_at: row.sent_at,
      item_count: itemsField?.[0]?.count ?? 0,
    };
  });
}

/**
 * Un pedido con sus items, para la pantalla de detalle/edicion y para armar
 * el texto de WhatsApp. Devuelve null si no existe o no es de esta
 * organizacion (RLS se encarga del segundo caso).
 */
export async function getOrder(id: string): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, supplier_id, supplier_name, status, created_at, sent_at")
    .eq("id", id)
    .single();

  if (error || !order) return null;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("id, product_id, brand, description, quantity")
    .eq("order_id", id)
    .order("description", { ascending: true });

  if (itemsError) throw itemsError;

  return {
    id: order.id,
    supplier_id: order.supplier_id,
    supplier_name: order.supplier_name,
    status: order.status as OrderStatus,
    created_at: order.created_at,
    sent_at: order.sent_at,
    items: (items ?? []) as OrderItem[],
  };
}
