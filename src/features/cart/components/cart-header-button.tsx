"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/features/cart/context";

/**
 * Punto de entrada a "Compras" que vive DENTRO del header (position: sticky,
 * no fixed). Antes era un tab flotante propio con position:fixed siempre
 * presente en pantalla -- en una tablet Android eso causaba corrupcion
 * visual (tearing) al scrollear la lista de productos. Confirmado
 * deshabilitando el modulo: sin el tab fixed, el problema desaparece. El
 * panel deslizable en si sigue siendo fixed, pero solo se monta mientras
 * esta abierto (ver CartPanel), asi que durante el scroll normal no hay
 * ningun elemento fixed del carrito en pantalla.
 */
export function CartHeaderButton() {
  const cart = useCart();
  if (!cart) return null;

  return (
    <button
      type="button"
      onClick={() => cart.setIsOpen(true)}
      aria-label="Ver compras"
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <ShoppingCart className="h-5 w-5" />
      {cart.itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {cart.itemCount}
        </span>
      )}
    </button>
  );
}
