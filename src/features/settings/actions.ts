"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export type InviteFormState = { error: string | null; success?: boolean };

/**
 * Alta de un empleado. Usa la service role key (auth.admin.createUser) porque
 * un usuario autenticado normal no puede crear otras cuentas — esta es la
 * única operación del MVP que necesita esa key, y solo corre en el servidor.
 */
export async function inviteEmployee(
  _prev: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const tempPassword = String(formData.get("tempPassword") ?? "");

  if (!email || !fullName || tempPassword.length < 6) {
    return { error: "Completá nombre, email y una contraseña de al menos 6 caracteres." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    return { error: "Solo el dueño puede agregar empleados." };
  }

  const admin = await createServiceRoleClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "No se pudo crear el usuario." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    organization_id: profile.organization_id,
    full_name: fullName,
    role: "employee",
  });

  if (profileError) {
    return { error: "Usuario creado pero no se pudo asignar a la organización." };
  }

  revalidatePath("/settings");
  return { error: null, success: true };
}

export type LogoFormState = { error: string | null; success?: boolean };

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

/**
 * Sube el logo del negocio al bucket publico "org-logos" y guarda la URL en
 * organizations.logo_url. Solo el dueño puede hacerlo (ver policies de
 * 0008_organization_logo.sql). Reemplaza el logo anterior si habia uno --no
 * se acumulan archivos viejos sin usar en el bucket.
 */
export async function updateOrganizationLogo(
  _prev: LogoFormState,
  formData: FormData
): Promise<LogoFormState> {
  const logo = formData.get("logo");

  if (!(logo instanceof File) || logo.size === 0) {
    return { error: "Elegí un archivo de imagen." };
  }
  if (logo.size > MAX_LOGO_SIZE) {
    return { error: "La imagen no puede pesar más de 2MB." };
  }
  if (!ALLOWED_LOGO_TYPES.includes(logo.type)) {
    return { error: "Formato no soportado. Usá PNG, JPG, WEBP o SVG." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    return { error: "Solo el dueño puede cambiar el logo." };
  }

  const ext = logo.name.split(".").pop() || "png";
  const path = `${profile.organization_id}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("org-logos")
    .upload(path, logo, { upsert: true, contentType: logo.type });

  if (uploadError) {
    return { error: "No se pudo subir la imagen." };
  }

  const { data: publicUrl } = supabase.storage.from("org-logos").getPublicUrl(path);
  // Cache-bust: el path es siempre el mismo (logo.<ext>) para no acumular
  // archivos viejos con upsert, pero eso significa que la URL no cambia
  // cuando se reemplaza el logo -- el navegador podria seguir mostrando el
  // cacheado. Se agrega ?v=timestamp para forzar que se pida de nuevo.
  const cacheBustedUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("organizations")
    .update({ logo_url: cacheBustedUrl })
    .eq("id", profile.organization_id);

  if (updateError) {
    return { error: "Imagen subida pero no se pudo guardar en la organización." };
  }

  revalidatePath("/settings", "layout");
  return { error: null, success: true };
}
