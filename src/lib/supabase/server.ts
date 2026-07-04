import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Cliente de Supabase para Server Components y Server Actions. Lee/escribe la
// sesion desde las cookies de Next.js -- asi RLS puede resolver auth.uid() en
// cada query hecha desde el servidor.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se puede ignorar si se llama desde un Server Component (sin
            // permiso de escritura); el middleware se encarga de refrescar
            // la sesion en ese caso.
          }
        },
      },
    }
  );
}

// Cliente con service role, SOLO para uso en el servidor (nunca importar desde
// un Client Component). Se usa para altas de usuarios (auth.admin.createUser)
// que no puede hacer un usuario autenticado comun.
export async function createServiceRoleClient() {
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
