import { isAuthRetryableFetchError, type SupabaseClient, type User } from "@supabase/supabase-js";

export type VerifiedUserResult = {
  user: User | null;
  /**
   * true si no pudimos confirmar si hay sesion o no por un problema
   * transitorio (red caida, timeout, rate limit de Supabase Auth) -- NO
   * porque la sesion sea invalida. Quien llama no deberia tratar esto como
   * "no hay sesion" ni forzar un logout: el proximo request probablemente
   * ande bien solo.
   */
  inconclusive: boolean;
};

/**
 * Wrapper de supabase.auth.getUser() que no confunde un problema de red
 * momentaneo con una sesion realmente invalida.
 *
 * Sin esto, un blip de wifi en la tablet del local (o un rate limit pasajero
 * de Supabase Auth al refrescar el token) hacia que `getUser()` devolviera
 * `user: null` por una razon transitoria, y el middleware/los layouts lo
 * trataban exactamente igual que "la sesion vencio de verdad" -- mandando al
 * empleado a /login aunque su refresh token siguiera perfectamente valido.
 * Esa era la causa real de los deslogueos random reportados (no la
 * configuracion de expiry, que ya esta en 1 semana).
 */
export async function getVerifiedUser(supabase: SupabaseClient): Promise<VerifiedUserResult> {
  let {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user && isAuthRetryableFetchError(error)) {
    // Reintento unico: la gran mayoria de los blips de red se resuelven al
    // toque. No tiene sentido reintentar mas veces aca (el request ya esta
    // renderizando una pagina, no queremos demorarlo demasiado).
    ({
      data: { user },
      error,
    } = await supabase.auth.getUser());
  }

  if (!user && isAuthRetryableFetchError(error)) {
    return { user: null, inconclusive: true };
  }

  return { user, inconclusive: false };
}

/** Lo unico que la app usa del usuario autenticado. */
export type SessionUser = { id: string; email: string | null };

export type SessionUserResult = { user: SessionUser | null; inconclusive: boolean };

/**
 * Igual que getVerifiedUser() pero SIN ir a Supabase Auth en cada llamada:
 * usa auth.getClaims(), que verifica la firma del token de sesion localmente
 * con la clave publica del proyecto (ES256; la clave se baja una vez y queda
 * cacheada en memoria). Con la base en Sao Paulo, cada viaje a Supabase Auth
 * desde el servidor era una espera mas en cada pagina y en cada formulario.
 *
 * Es seguro usarlo en Server Components, Server Actions y route handlers
 * porque el middleware (lib/supabase/middleware.ts) ya hace la validacion
 * completa contra Supabase Auth -- getVerifiedUser() -- en ESE MISMO
 * request, y refresca la sesion si hace falta. Si el token estuviera firmado
 * con la clave simetrica vieja (HS256), getClaims() cae solo a getUser().
 */
export async function getSessionUser(supabase: SupabaseClient): Promise<SessionUserResult> {
  let { data, error } = await supabase.auth.getClaims();

  if (!data && isAuthRetryableFetchError(error)) {
    ({ data, error } = await supabase.auth.getClaims());
  }

  if (!data && isAuthRetryableFetchError(error)) {
    return { user: null, inconclusive: true };
  }

  const claims = data?.claims;
  if (!claims?.sub) return { user: null, inconclusive: false };
  return {
    user: { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null },
    inconclusive: false,
  };
}

/**
 * Misma forma de respuesta que `supabase.auth.getUser()` (`{ data: { user } }`)
 * para reemplazarlo sin tocar el resto de cada Server Action / route handler.
 * Un problema transitorio se trata como "sin usuario", igual que antes.
 */
export async function getSessionUserResponse(supabase: SupabaseClient) {
  const { user } = await getSessionUser(supabase);
  return { data: { user } };
}
