import type { Product } from "@/lib/supabase/types";

export type SaleProduct = Pick<Product, "id" | "brand" | "description" | "barcode" | "unit_price" | "price_per_kilo">;

export const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "transferencia", label: "Transferencia / QR" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

/** Linea de la venta en curso (estado del cliente, ver SellView). */
export type SaleLine = {
  /** Clave local de la linea (no el id del producto). */
  key: string;
  productId: string;
  brand: string | null;
  description: string;
  unitPrice: number | null;
  kiloPrice: number | null;
  /** true = se cobra por kg (cantidad con decimales); false = por unidad. */
  fractioned: boolean;
  quantity: number;
};

export function linePrice(line: Pick<SaleLine, "fractioned" | "unitPrice" | "kiloPrice">): number {
  return (line.fractioned ? line.kiloPrice : line.unitPrice) ?? 0;
}

/** Redondeo a centavos -- evita totales tipo 1234.5600000001. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function lineTotal(line: SaleLine): number {
  return roundMoney(linePrice(line) * line.quantity);
}
