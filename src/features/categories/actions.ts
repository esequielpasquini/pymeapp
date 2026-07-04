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
