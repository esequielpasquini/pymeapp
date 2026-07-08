"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/supabase/types";

const STORAGE_KEY = "compras-cart-v1";

export type CartItem = {
  productId: string;
  description: string;
  brand: string | null;
  /** null si el producto no tiene ese precio cargado. */
  unitPrice: number | null;
  kiloPrice: number | null;
  /**
   * true = se cobra por kilo (pasos de 0.5, arrancando en 1).
   * false = se cobra por unidad (enteros), el comportamiento de siempre.
   * Solo se puede togglear si el producto tiene los dos precios cargados
   * (ver toggleFractioned) -- si solo tiene precio por kilo, arranca en
   * true igual porque no hay otra opcion.
   */
  fractioned: boolean;
  quantity: number;
};

export type CartContextValue = {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (product: Product) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleFractioned: (productId: string) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** true si el producto tiene al menos un precio cargado -- sin eso no hay
 * nada que agregar a la compra. */
export function hasAnyPrice(product: Pick<Product, "unit_price" | "price_per_kilo">): boolean {
  return product.unit_price !== null || product.price_per_kilo !== null;
}

function priceOf(item: Pick<CartItem, "fractioned" | "unitPrice" | "kiloPrice">): number {
  return (item.fractioned ? item.kiloPrice : item.unitPrice) ?? 0;
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
      if (raw) {
        const parsed = JSON.parse(raw);
        // Normalizado por si hay un carrito guardado con el formato viejo
        // (de antes de kiloPrice/fractioned) -- sin esto un item asi
        // mostraria el toggle "Fraccionado" con un precio por kilo
        // inexistente.
        if (Array.isArray(parsed)) {
          setItems(
            parsed.map(
              (item: Partial<CartItem> & { productId: string; description: string; quantity: number }) => ({
                productId: item.productId,
                description: item.description,
                brand: item.brand ?? null,
                unitPrice: item.unitPrice ?? null,
                kiloPrice: item.kiloPrice ?? null,
                fractioned: Boolean(item.fractioned),
                quantity: item.quantity,
              })
            )
          );
        }
      }
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

  const addItem = useCallback((product: Product) => {
    if (!hasAnyPrice(product)) return;

    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        const step = existing.fractioned ? 0.5 : 1;
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + step } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          description: product.description,
          brand: product.brand,
          unitPrice: product.unit_price,
          kiloPrice: product.price_per_kilo,
          // Por defecto precio unitario (como veniamos manejando); si no
          // tiene precio por unidad, arranca fraccionado por kilo porque no
          // hay otra opcion.
          fractioned: product.unit_price === null,
          quantity: 1,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.productId !== productId) return [item];
        const step = item.fractioned ? 0.5 : 1;
        const clamped = Math.max(0, Math.round(quantity / step) * step);
        return clamped <= 0 ? [] : [{ ...item, quantity: clamped }];
      })
    );
  }, []);

  // Solo tiene efecto si el producto tiene los dos precios cargados -- si
  // solo tiene uno, no hay nada que elegir. Al togglear se resetea la
  // cantidad a 1 porque una cantidad fraccionaria de "unidades" (ej. 1.5
  // bolsas) no tiene sentido al volver a precio unitario.
  const toggleFractioned = useCallback((productId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        if (item.unitPrice === null || item.kiloPrice === null) return item;
        return { ...item, fractioned: !item.fractioned, quantity: 1 };
      })
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = useMemo(() => items.reduce((sum, item) => sum + priceOf(item) * item.quantity, 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  // Memoizado para que los ~20 AddToCartButton de una pagina de resultados
  // no se re-rendericen todos juntos ante cualquier cambio de estado del
  // carrito que no les afecte (ej. abrir/cerrar el panel) -- solo cuando
  // cambia algo que de verdad usan.
  const value = useMemo<CartContextValue>(
    () => ({
      items,
      total,
      itemCount,
      addItem,
      updateQuantity,
      toggleFractioned,
      removeItem,
      clear,
      isOpen,
      setIsOpen,
    }),
    [items, total, itemCount, addItem, updateQuantity, toggleFractioned, removeItem, clear, isOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
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

/** Precio efectivo de un item segun este fraccionado o no -- exportado para
 * que CartPanel no tenga que reimplementar la misma logica. */
export function getItemPrice(item: Pick<CartItem, "fractioned" | "unitPrice" | "kiloPrice">): number {
  return priceOf(item);
}
