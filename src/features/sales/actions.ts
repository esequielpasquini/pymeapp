"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { normalizeBarcode, isValidBarcode } from "@/lib/barcode";
import { stripAccents } from "@/features/products/queries";
import { roundMoney, type SaleProduct } from "@/features/sales/types";

const SALE_PRODUCT_SELECT = "id, brand, description, barcode, unit_price, price_per_kilo";

/**
 * Busqueda para la pantalla Vender. Distinta de searchProducts a proposito:
 * no registra la busqueda en search_logs ni suma a "mas buscados" (escanear
 * para cobrar no es "buscar un precio"), y devuelve solo lo que hace falta
 * para armar la linea de venta.
 *
 * Si el termino tiene forma de codigo de barras y hay match exacto, se
 * devuelve solo eso -- el caso del lector USB, que tiene que agregar el
 * producto directo sin elegir de una lista.
 */
export async function findSaleProducts(query: string): Promise<{ exact: boolean; products: SaleProduct[] }> {
  const term = query.trim();
  if (term.length === 0) return { exact: false, products: [] };

  const supabase = await createClient();

  const barcode = /\s/.test(term) ? null : normalizeBarcode(term);
  if (barcode !== null && isValidBarcode(barcode)) {
    const { data } = await supabase
      .from("products")
      .select(SALE_PRODUCT_SELECT)
      .eq("is_active", true)
      .eq("barcode", barcode)
      .limit(5);
    if (data && data.length > 0) return { exact: true, products: data as SaleProduct[] };
  }

  if (term.length < 2) return { exact: false, products: [] };

  // Mismo criterio que searchProducts: search_text ya esta sin acentos y
  // tiene indice trigram. Se escapan % y _ para que no actuen de comodin.
  const pattern = stripAccents(term).replace(/[%_]/g, (c) => `\\${c}`);
  const { data } = await supabase
    .from("products")
    .select(SALE_PRODUCT_SELECT)
    .eq("is_active", true)
    .ilike("search_text", `%${pattern}%`)
    .order("description")
    .limit(8);

  return { exact: false, products: (data ?? []) as SaleProduct[] };
}

const saleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        brand: z.string().nullable(),
        description: z.string().min(1),
        unitPrice: z.number().nonnegative(),
        fractioned: z.boolean(),
        quantity: z.number().positive(),
      })
    )
    .min(1, "La venta no tiene productos."),
  paymentMethod: z.enum(["efectivo", "debito", "credito", "transferencia"]),
  amountPaid: z.number().nonnegative().nullable(),
});

export type RegisterSaleInput = z.infer<typeof saleSchema>;
export type RegisterSaleResult = { error: string | null; total?: number; change?: number | null };

/**
 * Registra la venta cobrada. El total y el vuelto se recalculan aca, no se
 * confia en los del cliente. Los precios por linea si vienen del cliente
 * (mismo criterio que confirmSale del carrito): es el precio que se le
 * mostro al cliente al cobrar, aunque el catalogo cambie despues.
 */
export async function registerSale(input: RegisterSaleInput): Promise<RegisterSaleResult> {
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Datos de la venta inválidos." };
  }
  const { items, paymentMethod, amountPaid } = parsed.data;

  const lines = items.map((item) => ({
    ...item,
    quantity: Math.round(item.quantity * 1000) / 1000,
    lineTotal: roundMoney(item.unitPrice * item.quantity),
  }));
  const total = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0));

  let change: number | null = null;
  if (paymentMethod === "efectivo") {
    if (amountPaid === null) return { error: "Ingresá con cuánto paga el cliente." };
    if (amountPaid < total) return { error: "El monto recibido no alcanza para el total." };
    change = roundMoney(amountPaid - total);
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

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      organization_id: profile.organization_id,
      total,
      payment_method: paymentMethod,
      amount_paid: paymentMethod === "efectivo" ? amountPaid : null,
      change_given: change,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (saleError || !sale) return { error: "No se pudo guardar la venta." };

  const { error: itemsError } = await supabase.from("sale_items").insert(
    lines.map((line) => ({
      sale_id: sale.id,
      product_id: line.productId,
      brand: line.brand,
      description: line.description,
      fractioned: line.fractioned,
      unit_price: line.unitPrice,
      quantity: line.quantity,
      line_total: line.lineTotal,
    }))
  );

  if (itemsError) return { error: "Se guardó la venta pero no se pudieron guardar los productos." };

  return { error: null, total, change };
}
