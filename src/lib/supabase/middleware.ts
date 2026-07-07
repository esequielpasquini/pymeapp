import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getVerifiedUser } from "@/lib/supabase/get-verified-user";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Refresca la sesion de Supabase en cada request y redirige a /login si no
// hay usuario autenticado y la ruta no es publica. Se invoca desde
// middleware.ts en la raiz del proyecto.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { user, inconclusive } = await getVerifiedUser(supabase);

  const isPublicPath = request.nextUrl.pathname.startsWith("/login");

  // Si no pudimos confirmar la sesion por un problema transitorio (ver
  // getVerifiedUser), no forzamos el redirect -- dejamos pasar el request
  // tal cual. Forzar el logout aca es lo que causaba que un empleado con
  // sesion perfectamente valida terminara en /login por un blip de red.
  if (!user && !inconclusive && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
