import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// OJO: este archivo TIENE que estar en src/ (al lado de src/app). Con la
// estructura src/, Next.js ignora en silencio un middleware.ts en la raiz del
// repo -- estuvo ahi hasta noviembre 2026 y nunca se ejecuto: no se validaba
// la sesion contra Supabase ni se refrescaba el token en cada request.

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Todo menos assets estaticos: imagenes, iconos y el manifest de la PWA
  // tienen que poder bajarse sin sesion (los pide la pantalla de login).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml)$).*)",
  ],
};
