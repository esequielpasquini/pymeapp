"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const productSchema = z.object({
  brand: z.string().trim().optional(),
  description: z.string().trim().min(1, "La descripcion es obligatoria"),
  categoryId: z.string().trim().min(1, "La categoria es obligatoria"),
  supplierId: z.string().trim().optional(),
  pricePerKilo: z.string().optional(),
  unitPrice: z.string().optional(),
  notes: z.string().trim().optional(),
});

function toNumberOrNull(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toSupplierIdOrNull(value: string | undefined): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

export type ProductFormState = { error: string | null };

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Datos invalidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "No se encontro tu organizacion." };

  const supplierId = toSupplierIdOrNull(parsed.data.supplierId);
  const pricePerKilo = toNumberOrNull(parsed.data.pricePerKilo);
  const unitPrice = toNumberOrNull(parsed.data.unitPrice);

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      organization_id: profile.organization_id,
      supplier_id: supplierId,
      category_id: parsed.data.categoryId,
      brand: parsed.data.brand || null,
      description: parsed.data.description,
      price_per_kilo: pricePerKilo,
      unit_price: unitPrice,
      notes: parsed.data.notes || null,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: "No se pudo crear el producto." };

  if (pricePerKilo !== null || unitPrice !== null) {
    await supabase.from("price_changes").insert({
      organization_id: profile.organization_id,
      product_id: product.id,
      previous_price_per_kilo: null,
      new_price_per_kilo: pricePerKilo,
      previous_unit_price: null,
      new_unit_price: unitPrice,
      reason: "manual",
      changed_by: user.id,
    });
  }

  revalidatePath("/products");
  revalidatePath("/search");
  redirect(`/products/${product.id}`);
}

export async function updateProduct(
  productId: string,
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Datos invalidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "No se encontro tu organizacion." };

  const { data: current } = await supabase
    .from("products")
    .select("price_per_kilo, unit_price")
    .eq("id", productId)
    .single();

  const supplierId = toSupplierIdOrNull(parsed.data.supplierId);
  const pricePerKilo = toNumberOrNull(parsed.data.pricePerKilo);
  const unitPrice = toNumberOrNull(parsed.data.unitPrice);

  const { error } = await supabase
    .from("products")
    .update({
      supplier_id: supplierId,
      category_id: parsed.data.categoryId,
      brand: parsed.data.brand || null,
      description: parsed.data.description,
      price_per_kilo: pricePerKilo,
      unit_price: unitPrice,
      notes: parsed.data.notes || null,
      updated_by: user.id,
    })
    .eq("id", productId);

  if (error) return { error: "No se pudo actualizar el producto." };

  const priceChanged =
    current &&
    (current.price_per_kilo !== pricePerKilo || current.unit_price !== unitPrice);

  if (priceChanged) {
    await supabase.from("price_changes").insert({
      organization_id: profile.organization_id,
      product_id: productId,
      previous_price_per_kilo: current?.price_per_kilo ?? null,
      new_price_per_kilo: pricePerKilo,
      previous_unit_price: current?.unit_price ?? null,
      new_unit_price: unitPrice,
      reason: "manual",
      changed_by: user.id,
    });
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/search");
  return { error: null };
}

export async function deactivateProduct(productId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_active: false }).eq("id", productId);
  if (error) throw error;
  revalidatePath("/products");
  revalidatePath("/search");
}
