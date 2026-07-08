"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/supabase/types";

const STORAGE_KEY = "compras-cart-v1";

export type CartUnit = "unidad" | "kg";

export type CartItem = {
  productId: string;
  description: string;
  brand: string | null;
  unit: CartUnit;
  unitPrice: number;
  quantity: number;
};

export type CartContextValue = {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (product: Product) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Que precio usar al agregar un producto a la "compra" en curso. Si tiene
 * precio por unidad, se usa ese (es el modo mas comun); si solo tiene precio
 * por kilo, se usa ese y la cantidad pasa a representar kilos. Si no tiene
 * ninguno de los dos, no hay nada que calcular.
 */
export function getApplicablePrice(
  product: Pick<Product, "unit_price" | "price_per_kilo">
): { price: number; unit: CartUnit } | null {
  if (product.unit_price !== null) return { price: product.unit_price, unit: "unidad" };
  if (product.price_per_kilo !== null) return { price: product.price_per_kilo, unit: "kg" };
  return null;
}

/**
 * Reemplazo de la calculadora de mostrador: mientras un empleado busca
 * productos para un cliente, va agregando cada uno con su cantidad y ve el
 * total acumulado. Es un scratchpad, no una venta real -- no toca
 * inventario ni queda registrado en la base, por eso vive enteramente en el
 * cliente (localStorage) y no necesita tablas ni RLS nuevas mas alla del
 * flag del modulo (organization_modules).
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage bloqueado/corrupto (ej. modo incognito) -- arrancamos
      // con la compra vacia en vez de romper la pantalla.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignorar -- no es critico si no se puede persistir.
    }
  }, [items, hydrated]);

  function addItem(product: Product) {
    const applicable = getApplicablePrice(product);
    if (!applicable) return;

    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          description: product.description,
          brand: product.brand,
          unit: applicable.unit,
          unitPrice: applicable.price,
          quantity: 1,
        },
      ];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    const clamped = Math.max(0, Math.round(quantity * 100) / 100);
    setItems((prev) =>
      clamped <= 0
        ? prev.filter((item) => item.productId !== productId)
        : prev.map((item) => (item.productId === productId ? { ...item, quantity: clamped } : item))
    );
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }

  function clear() {
    setItems([]);
  }

  const total = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, total, itemCount, addItem, updateQuantity, removeItem, clear, isOpen, setIsOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

/**
 * Devuelve null si no hay CartProvider montado -- que es exactamente lo que
 * pasa cuando el modulo "compras" esta deshabilitado para la organizacion
 * (ver (owner)/layout.tsx y (employee)/layout.tsx). Los componentes que
 * ofrecen "agregar a compras" chequean esto para no renderizarse en vez de
 * necesitar que les pasen un prop de "modulo habilitado" a mano.
 */
export function useCart(): CartContextValue | null {
  return useContext(CartContext);
}
