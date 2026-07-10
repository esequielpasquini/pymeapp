"use client";

import { ShoppingCart, Check } from "lucide-react";
import { useCart, hasAnyPrice } from "@/features/cart/context";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/supabase/types";

/**
 * Botón "Agregar" para sumar un producto a la compra en curso (modulo
 * "compras"). Se auto-oculta si el modulo esta deshabilitado (useCart()
 * devuelve null sin CartProvider montado) o si el producto no tiene ningun
 * precio cargado -- no hay nada que sumar en ese caso.
 *
 * OJO: en una version anterior este boton (con icono + un timer local de
 * useState/setTimeout) causaba un bug de corrupcion visual (tearing) al
 * scrollear en una tablet Android especifica, repetido en cada fila de la
 * lista de resultados. Se solucionó sacando el timer Y el icono (quedo solo
 * texto). Ahora se vuelve a agregar el icono a pedido, pero SIN el timer
 * (el estado "ya esta en el carrito" sale de cart.items, no de un temporizador
 * propio) -- si el tearing reaparece en esa tablet, este icono es el primer
 * sospechoso a revertir.
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
      aria-label={inCart ? "Ya está en el carrito, agregar otra vez" : "Agregar al carrito"}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
        inCart ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary/10"
      )}
    >
      {inCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
    </button>
  );
}
