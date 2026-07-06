import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LoginBranding, Profile } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";

export type CurrentSession = {
  user: User | null;
  profile: Profile | null;
};

/**
 * Devuelve el usuario autenticado y su perfil por separado. Es importante
 * NO colapsar esto en un solo booleano: un usuario puede tener sesion valida
 * en Supabase Auth pero todavia no tener una fila en `profiles` (por ejemplo
 * si fue creado manualmente desde el dashboard sin seguir el paso 6 de
 * docs/DEPLOYMENT.md). Si tratamos "sin perfil" igual que "sin sesion", el
 * usuario ve un loop confuso: login exitoso -> redirect -> vuelve a /login
 * como si la contrasena estuviera mal, cuando en realidad el problema es
 * que le falta el alta en `profiles`.
 */
export async function getCurrentSession(): Promise<CurrentSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data, error } = await supabase
    .from("profiles")
    .select("id, organization_id, full_name, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    // Esto NO deberia pasar si la fila existe y RLS esta bien configurado.
    // Se loguea explicitamente (en vez de tragarse el error como antes) para
    // poder diagnosticar rapido: revisa la terminal donde corre `npm run dev`.
    console.error(
      `[getCurrentSession] error al buscar profiles.id = ${user.id}:`,
      error.message,
      error.details ?? ""
    );
  }

  return { user, profile: (data as Profile | null) ?? null };
}

/**
 * Atajo para los casos que solo necesitan el perfil (la mayoria de layouts).
 * OJO: devuelve null tanto si no hay sesion como si falta el perfil. Para
 * distinguir ambos casos (y no mandar a un usuario logueado de vuelta a
 * /login sin explicacion) usa getCurrentSession() directamente.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const { profile } = await getCurrentSession();
  return profile;
}

/**
 * Nombre/logo/descripcion a mostrar en la pantalla de login. Se llama SIN
 * sesion (el usuario todavia no se autentico), asi que un select comun a
 * `organizations` choca con su RLS (organizations_select exige
 * auth_org_id()). Por eso se usa la funcion `get_login_branding()`
 * (SECURITY DEFINER, ver 0014_login_branding.sql), habilitada para el rol
 * anon y que solo expone estas 3 columnas no sensibles.
 */
export async function getLoginBranding(): Promise<LoginBranding | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_login_branding").maybeSingle();
  if (error || !data) return null;
  return data as LoginBranding;
}
