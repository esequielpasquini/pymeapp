"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SupplierFormState = { error: string | null };

export async function createSupplier(
  _prev: SupplierFormState,
  formData: FormData
): Promise<SupplierFormState> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "El nombre es obligatorio." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "No se encontro tu organizacion." };

  const { error } = await supabase.from("suppliers").insert({
    organization_id: profile.organization_id,
    name,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un proveedor con ese nombre." };
    }
    return { error: "No se pudo crear el proveedor." };
  }

  revalidatePath("/suppliers");
  revalidatePath("/products");
  revalidatePath("/products/new");
  revalidatePath("/search");
  return { error: null };
}

export async function updateSupplier(
  supplierId: string,
  _prev: SupplierFormState,
  formData: FormData
): Promise<SupplierFormState> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "El nombre es obligatorio." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .update({ name })
    .eq("id", supplierId);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un proveedor con ese nombre." };
    }
    return { error: "No se pudo actualizar el proveedor." };
  }

  revalidatePath("/suppliers");
  revalidatePath("/products");
  revalidatePath("/search");
  return { error: null };
}

/**
 * Eliminar un proveedor es un DELETE real (no soft-delete como productos):
 * suppliers no tiene historial propio que preservar, y products.supplier_id
 * es "on delete set null" -- los productos de ese proveedor no desaparecen,
 * simplemente quedan como "Sin proveedor".
 */
export async function deleteSupplier(supplierId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("suppliers").delete().eq("id", supplierId);
  if (error) {
    return { error: "No se pudo eliminar el proveedor." };
  }

  revalidatePath("/suppliers");
  revalidatePath("/products");
  revalidatePath("/search");
  revalidatePath("/ventas");
  return { error: null };
}
