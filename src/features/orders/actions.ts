"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OrderItemInput = {
  productId: string | null;
  brand: string | null;
  description: string;
  quantity: number;
};

export type OrderActionState = { error: string | null };

/**
 * Arma un pedido nuevo (estado "pendiente" por default) a partir de un
 * proveedor y una lista de items con cantidad. Redirige al detalle del
 * pedido creado -- se llama directo desde el cliente via useTransition, no
 * desde un <form action>, asi que el redirect interno funciona igual (mismo
 * patron que createProduct).
 */
export async function createOrder(supplierId: string, items: OrderItemInput[]) {
  const withQty = items.filter((item) => item.quantity > 0);
  if (withQty.length === 0) {
    return { error: "Agregá al menos un producto con cantidad." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "owner") {
    return { error: "Solo el dueño puede armar pedidos." };
  }

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("name")
    .eq("id", supplierId)
    .single();
  if (!supplier) return { error: "No se encontró el proveedor." };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      organization_id: profile.organization_id,
      supplier_id: supplierId,
      supplier_name: supplier.name,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (orderError || !order) return { error: "No se pudo crear el pedido." };

  const { error: itemsError } = await supabase.from("order_items").insert(
    withQty.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      brand: item.brand,
      description: item.description,
      quantity: item.quantity,
    }))
  );
  if (itemsError) return { error: "Se creó el pedido pero no se pudieron guardar los productos." };

  revalidatePath("/orders");
  redirect(`/orders/${order.id}`);
}

/**
 * Reemplaza los items de un pedido pendiente (delete + insert, no hay
 * policy de update fila por fila -- ver 0019_orders.sql). Solo permitido
 * mientras el pedido siga "pendiente"; uno "enviado" es un registro
 * historico y no se edita.
 */
export async function updateOrderItems(orderId: string, items: OrderItemInput[]): Promise<OrderActionState> {
  const withQty = items.filter((item) => item.quantity > 0);
  if (withQty.length === 0) {
    return { error: "Agregá al menos un producto con cantidad." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que iniciar sesión de nuevo." };

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();
  if (!order) return { error: "No se encontró el pedido." };
  if (order.status !== "pendiente") return { error: "Este pedido ya fue enviado, no se puede editar." };

  const { error: deleteError } = await supabase.from("order_items").delete().eq("order_id", orderId);
  if (deleteError) return { error: "No se pudieron actualizar los productos." };

  const { error: insertError } = await supabase.from("order_items").insert(
    withQty.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      brand: item.brand,
      description: item.description,
      quantity: item.quantity,
    }))
  );
  if (insertError) return { error: "No se pudieron guardar los productos actualizados." };

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { error: null };
}

/**
 * Cambia el estado de un pedido. Al marcarlo "enviado" se registra sent_at;
 * si se vuelve a "pendiente" (por error, ej.) se limpia.
 */
export async function setOrderStatus(orderId: string, status: "pendiente" | "enviado"): Promise<OrderActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que iniciar sesión de nuevo." };

  const { error } = await supabase
    .from("orders")
    .update({ status, sent_at: status === "enviado" ? new Date().toISOString() : null })
    .eq("id", orderId);
  if (error) return { error: "No se pudo actualizar el estado del pedido." };

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { error: null };
}

/**
 * Crea un pedido nuevo "pendiente" para el mismo proveedor, copiando los
 * items del pedido de referencia -- para no tener que rearmar desde cero un
 * pedido habitual. Redirige al pedido nuevo.
 */
export async function duplicateOrder(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "owner") {
    return { error: "Solo el dueño puede armar pedidos." };
  }

  const { data: source } = await supabase
    .from("orders")
    .select("supplier_id, supplier_name")
    .eq("id", orderId)
    .single();
  if (!source) return { error: "No se encontró el pedido de referencia." };

  const { data: sourceItems, error: sourceItemsError } = await supabase
    .from("order_items")
    .select("product_id, brand, description, quantity")
    .eq("order_id", orderId);
  if (sourceItemsError) return { error: "No se pudieron leer los productos del pedido de referencia." };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      organization_id: profile.organization_id,
      supplier_id: source.supplier_id,
      supplier_name: source.supplier_name,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (orderError || !order) return { error: "No se pudo crear el pedido." };

  if (sourceItems && sourceItems.length > 0) {
    const { error: itemsError } = await supabase.from("order_items").insert(
      sourceItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        brand: item.brand,
        description: item.description,
        quantity: item.quantity,
      }))
    );
    if (itemsError) return { error: "Se creó el pedido pero no se pudieron copiar los productos." };
  }

  revalidatePath("/orders");
  redirect(`/orders/${order.id}`);
}
