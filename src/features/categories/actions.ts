"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CategoryFormState = { error: string | null };

export async function createCategory(
  _prev: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();

  if (!name) {
    return { error: "El nombre es obligatorio." };
  }
  if (!icon) {
    return { error: "Elegi un icono." };
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

  const { error } = await supabase.from("categories").insert({
    organization_id: profile.organization_id,
    name,
    icon,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe una categoria con ese nombre." };
    }
    return { error: "No se pudo crear la categoria." };
  }

  revalidatePath("/categories");
  revalidatePath("/products");
  revalidatePath("/search");
  return { error: null };
}

export type DeleteCategoryState = { error: string | null };

/**
 * Borra una categoria. Los productos que la tenian asignada pasan a "Sin
 * categoria" -- la reasignacion y el borrado pasan por la funcion SQL
 * delete_category (ver 0010_delete_category.sql) para que sean atomicos:
 * la FK de products.category_id no tiene ON DELETE, asi que un DELETE
 * directo fallaria si quedara algun producto apuntando a la categoria.
 */
export async function deleteCategory(categoryId: string): Promise<DeleteCategoryState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_category", { p_category_id: categoryId });

  if (error) {
    return { error: error.message || "No se pudo eliminar la categoria." };
  }

  revalidatePath("/categories");
  revalidatePath("/products");
  revalidatePath("/search");
  return { error: null };
}

export async function updateCategory(
  categoryId: string,
  _prev: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();

  if (!name) {
    return { error: "El nombre es obligatorio." };
  }
  if (!icon) {
    return { error: "Elegi un icono." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name, icon })
    .eq("id", categoryId);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe una categoria con ese nombre." };
    }
    return { error: "No se pudo actualizar la categoria." };
  }

  revalidatePath("/categories");
  revalidatePath("/products");
  revalidatePath("/search");
  return { error: null };
}
