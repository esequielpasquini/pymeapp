"use server";

import { createClient } from "@/lib/supabase/server";

export type ConfirmSaleItem = {
  productId: string;
  description: string;
  brand: string | null;
  /** Precio efectivo ya resuelto (fractioned ? kiloPrice : unitPrice) --
   * ver getItemPrice en features/cart/context.tsx. Lo resuelve el cliente
   * porque ahi es donde vive el estado del carrito; el server action
   * confia en el total recalculado server-side, no en el que mande el
   * cliente, pero el precio unitario de cada linea si viene del cliente
   * (es el precio que se le mostro al empleado al vender, no hace falta
   * revalidarlo contra el catalogo -- puede haber cambiado desde que se
   * agrego al carrito).
   */
  unitPrice: number;
  fractioned: boolean;
  quantity: number;
};

export type ConfirmSaleResult = { error: string | null };

/**
 * Guarda un snapshot de la compra en curso como una venta confirmada y
 * devuelve el resultado. No borra el carrito en si -- eso lo hace el
 * cliente (CartPanel) solo si esto devuelve exito, para no perder los items
 * si falla el guardado.
 */
export async function confirmSale(items: ConfirmSaleItem[]): Promise<ConfirmSaleResult> {
  if (items.length === 0) {
    return { error: "El carrito esta vacío." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que iniciar sesión de nuevo." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "No se encontró tu organización." };

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({ organization_id: profile.organization_id, total, created_by: user.id })
    .select("id")
    .single();

  if (saleError || !sale) return { error: "No se pudo guardar la venta." };

  const { error: itemsError } = await supabase.from("sale_items").insert(
    items.map((item) => ({
      sale_id: sale.id,
      product_id: item.productId,
      brand: item.brand,
      description: item.description,
      fractioned: item.fractioned,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      line_total: item.unitPrice * item.quantity,
    }))
  );

  if (itemsError) return { error: "Se guardó la venta pero no se pudieron guardar los productos." };

  return { error: null };
}
