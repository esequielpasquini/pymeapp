"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart, getApplicablePrice } from "@/features/cart/context";
import type { Product } from "@/lib/supabase/types";

/**
 * Botón "Agregar" para sumar un producto a la compra en curso (modulo
 * "compras"). Se auto-oculta si el modulo esta deshabilitado (useCart()
 * devuelve null sin CartProvider montado) o si el producto no tiene ningun
 * precio cargado -- no hay nada que sumar en ese caso.
 */
export function AddToCartButton({ product }: { product: Product }) {
  const cart = useCart();
  const [justAdded, setJustAdded] = useState(false);

  if (!cart) return null;
  if (!getApplicablePrice(product)) return null;

  const { addItem, setIsOpen } = cart;

  function handleAdd() {
    addItem(product);
    setIsOpen(true);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 md:text-sm"
    >
      {justAdded ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
      {justAdded ? "Agregado" : "Agregar"}
    </button>
  );
}
