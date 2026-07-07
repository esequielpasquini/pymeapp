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
