"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseTags } from "@/features/imports/parse";

const productSchema = z.object({
  brand: z.string().trim().optional(),
  description: z.string().trim().min(1, "La descripcion es obligatoria"),
  categoryId: z.string().trim().min(1, "La categoria es obligatoria"),
  supplierId: z.string().trim().optional(),
  pricePerKilo: z.string().optional(),
  unitPrice: z.string().optional(),
  notes: z.string().trim().optional(),
  tags: z.string().trim().optional(),
});

function toNumberOrNull(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toSupplierIdOrNull(value: string | undefined): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

const IMAGE_MAX_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * Resuelve que valor de image_url le corresponde a un producto tras el
 * submit: si se adjunto un archivo nuevo lo sube al bucket "product-images"
 * y devuelve la URL publica; si se tildo "quitar imagen" devuelve null; si
 * no, deja la que ya tenia (currentImageUrl) sin tocar.
 */
async function resolveProductImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  formData: FormData,
  currentImageUrl: string | null
): Promise<{ imageUrl: string | null; error: string | null }> {
  const image = formData.get("image");

  if (image instanceof File && image.size > 0) {
    if (image.size > IMAGE_MAX_SIZE) {
      return { imageUrl: currentImageUrl, error: "La imagen no puede pesar más de 4MB." };
    }
    if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
      return { imageUrl: currentImageUrl, error: "Formato no soportado. Usá PNG, JPG o WEBP." };
    }

    const ext = image.name.split(".").pop() || "jpg";
    const path = `${organizationId}/${Date.now()}-${randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, image, { contentType: image.type });

    if (uploadError) {
      return { imageUrl: currentImageUrl, error: "No se pudo subir la imagen." };
    }

    const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(path);
    return { imageUrl: `${publicUrl.publicUrl}?v=${Date.now()}`, error: null };
  }

  if (formData.get("removeImage") === "on") {
    return { imageUrl: null, error: null };
  }

  return { imageUrl: currentImageUrl, error: null };
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
  const tags = parseTags(parsed.data.tags);

  const { imageUrl, error: imageError } = await resolveProductImage(
    supabase,
    profile.organization_id,
    formData,
    null
  );
  if (imageError) return { error: imageError };

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
      image_url: imageUrl,
      tags,
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
    .select("price_per_kilo, unit_price, image_url")
    .eq("id", productId)
    .single();

  const supplierId = toSupplierIdOrNull(parsed.data.supplierId);
  const pricePerKilo = toNumberOrNull(parsed.data.pricePerKilo);
  const unitPrice = toNumberOrNull(parsed.data.unitPrice);
  const tags = parseTags(parsed.data.tags);

  const { imageUrl, error: imageError } = await resolveProductImage(
    supabase,
    profile.organization_id,
    formData,
    current?.image_url ?? null
  );
  if (imageError) return { error: imageError };

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
      image_url: imageUrl,
      tags,
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

/**
 * "Eliminar" un producto: en realidad es un soft-delete (is_active = false),
 * no un DELETE de la fila. Se eligio asi para no perder el historial de
 * precios (price_changes referencia product_id) ni romper import_items de
 * importaciones ya aplicadas -- el producto desaparece de los listados
 * (dueño y buscador del empleado) pero los datos quedan preservados.
 */
export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("products").update({ is_active: false }).eq("id", productId);
  if (error) throw new Error("No se pudo eliminar el producto.");

  revalidatePath("/products");
  revalidatePath("/search");
  redirect("/products");
}
