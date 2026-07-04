"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { applyPercent } from "@/features/price-adjustments/logic";
import type { RoundingMode } from "@/lib/supabase/types";

export type AdjustmentPreviewItem = {
  productId: string;
  description: string;
  brand: string | null;
  currentUnitPrice: number | null;
  proposedUnitPrice: number | null;
  currentPricePerKilo: number | null;
  proposedPricePerKilo: number | null;
};

/** Solo lectura: calcula la vista previa, no toca la base de datos. */
export async function previewBulkAdjustment(
  supplierId: string,
  percent: number,
  rounding: RoundingMode
): Promise<AdjustmentPreviewItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, brand, description, unit_price, price_per_kilo")
    .eq("supplier_id", supplierId)
    .eq("is_active", true)
    .order("description");

  if (error) throw new Error(error.message);

  return (data ?? []).map((p) => ({
    productId: p.id,
    description: p.description,
    brand: p.brand,
    currentUnitPrice: p.unit_price,
    proposedUnitPrice: applyPercent(p.unit_price, percent, rounding),
    currentPricePerKilo: p.price_per_kilo,
    proposedPricePerKilo: applyPercent(p.price_per_kilo, percent, rounding),
  }));
}

/** Aplica el ajuste en una transacción del lado de Postgres (apply_bulk_price_adjustment). */
export async function applyBulkAdjustment(
  supplierId: string,
  percent: number,
  rounding: RoundingMode
): Promise<{ count: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("apply_bulk_price_adjustment", {
    p_supplier_id: supplierId,
    p_percent: percent,
    p_rounding: rounding,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/products");
  revalidatePath("/price-adjustments");
  return { count: data as number };
}
