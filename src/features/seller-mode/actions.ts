"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SELLER_MODE_COOKIE } from "@/features/seller-mode/constants";

/**
 * "Modo vendedor": el dueño usa la misma pantalla que un empleado (solo el
 * buscador en /search, sin panel ni el resto de las funcionalidades), por
 * ejemplo en la compu del mostrador. Es una preferencia de este dispositivo
 * (cookie), no un permiso: el rol sigue siendo owner y puede volver al modo
 * admin desde el menu del usuario.
 */
export async function enterSellerMode() {
  const cookieStore = await cookies();
  cookieStore.set(SELLER_MODE_COOKIE, "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/search");
}

export async function exitSellerMode() {
  const cookieStore = await cookies();
  cookieStore.delete(SELLER_MODE_COOKIE);
  redirect("/dashboard");
}
