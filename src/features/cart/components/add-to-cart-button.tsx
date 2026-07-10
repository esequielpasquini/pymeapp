"use client";

import { useCart, hasAnyPrice } from "@/features/cart/context";
import type { Product } from "@/lib/supabase/types";

/**
 * Botón "Agregar" para sumar un producto a la compra en curso (modulo
 * "compras"). Se auto-oculta si el modulo esta deshabilitado (useCart()
 * devuelve null sin CartProvider montado) o si el producto no tiene ningun
 * precio cargado -- no hay nada que sumar en ese caso.
 *
 * A PROPOSITO SIN ICONO: confirmado dos veces que un icono (ShoppingCart/
 * Check via lucide) en este boton, repetido en cada fila de la lista de
 * resultados, causa un bug de corrupcion visual (tearing) al scrollear en
 * una tablet Android especifica. La primera vez se lo saco junto con un
 * timer local de useState/setTimeout; se volvio a probar reintroduciendo
 * SOLO el icono (sin timer) y el problema volvio igual -- asi que el icono
 * en si es la causa, no el timer. No reintroducir un icono aca sin probar
 * primero en esa tablet.
 */
export function AddToCartButton({ product }: { product: Product }) {
  const cart = useCart();
  if (!cart) return null;
  if (!hasAnyPrice(product)) return null;

  const { addItem, setIsOpen, items } = cart;
  const inCart = items.some((item) => item.productId === product.id);

  function handleAdd() {
    addItem(product);
    setIsOpen(true);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="text-xs text-primary hover:text-primary/80 md:text-sm"
    >
      {inCart ? "En el carrito" : "Agregar"}
    </button>
  );
}
