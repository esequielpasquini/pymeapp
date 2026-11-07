import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSession } from "@/features/auth/queries";
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
  // Ya viene en el mismo query del perfil (getCurrentSession, cacheado por
  // request): antes esto repetia la verificacion de sesion, el perfil y la
  // organizacion -- 3 viajes mas a Supabase en cada pagina.
  const { organization } = await getCurrentSession();
  return organization;
}
