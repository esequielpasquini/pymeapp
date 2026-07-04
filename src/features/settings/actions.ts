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
