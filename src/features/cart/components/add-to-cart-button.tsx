"use client";

import { useCart, getApplicablePrice } from "@/features/cart/context";
import type { Product } from "@/lib/supabase/types";

/**
 * Botón "Agregar" para sumar un producto a la compra en curso (modulo
 * "compras"). Se auto-oculta si el modulo esta deshabilitado (useCart()
 * devuelve null sin CartProvider montado) o si el producto no tiene ningun
 * precio cargado -- no hay nada que sumar en ese caso.
 *
 * A proposito SIN icono ni animacion/timer propios (antes tenia useState +
 * setTimeout + swap de icono ShoppingCart/Check). Confirmado que este
 * boton, repetido en cada tarjeta de la lista de resultados, causaba un
 * bug de corrupcion visual (tearing) al scrollear en una tablet Android
 * especifica -- sacandolo del todo el problema desaparecia por completo.
 * Esta es la version mas liviana posible sin perder la funcionalidad,
 * para reducir al minimo lo que se repite por fila. El feedback de "ya
 * esta" ahora sale del estado del carrito en vez de un timer local.
 */
export function AddToCartButton({ product }: { product: Product }) {
  const cart = useCart();
  if (!cart) return null;
  if (!getApplicablePrice(product)) return null;

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
