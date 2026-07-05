import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Organization, Profile } from "@/lib/supabase/types";

export async function listEmployees(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").order("full_name");
  if (error) throw error;
  return (data ?? []) as Profile[];
}

/**
 * Organizacion del usuario logueado (via su perfil). Se usa tanto en la
 * pantalla de Configuracion (para el formulario de logo) como en los layouts
 * de dueño/empleado (para mostrar el logo en el nav).
 */
export async function getMyOrganization(): Promise<Organization | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return null;

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.organization_id)
    .maybeSingle();
  if (error) return null;
  return data as Organization | null;
}
