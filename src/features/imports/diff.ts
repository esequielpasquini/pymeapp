import "server-only";
import { matchKey, type ParsedRow } from "@/features/imports/parse";
import type { ImportItemAction } from "@/lib/supabase/types";

export type ExistingProduct = {
  id: string;
  brand: string | null;
  description: string;
  price_per_kilo: number | null;
  unit_price: number | null;
  supplier_name: string | null;
};

export type DiffItem = {
  action: ImportItemAction;
  productId: string | null;
  brand: string | null;
  description: string;
  supplierName: string | null;
  pricePerKilo: number | null;
  unitPrice: number | null;
  previousPricePerKilo: number | null;
  previousUnitPrice: number | null;
};

export type DiffSummary = { new: number; modified: number; removed: number; unchanged: number };

export function computeImportDiff(
  rows: ParsedRow[],
  existingProducts: ExistingProduct[]
): { items: DiffItem[]; summary: DiffSummary } {
  const existingByKey = new Map<string, ExistingProduct>();
  for (const p of existingProducts) {
    existingByKey.set(matchKey(p.brand, p.description, p.supplier_name), p);
  }

  const matchedIds = new Set<string>();
  const items: DiffItem[] = [];
  const summary: DiffSummary = { new: 0, modified: 0, removed: 0, unchanged: 0 };

  for (const row of rows) {
    const key = matchKey(row.brand, row.description, row.supplierName);
    const existing = existingByKey.get(key);

    if (!existing) {
      items.push({
        action: "create",
        productId: null,
        brand: row.brand,
        description: row.description,
        supplierName: row.supplierName,
        pricePerKilo: row.pricePerKilo,
        unitPrice: row.unitPrice,
        previousPricePerKilo: null,
        previousUnitPrice: null,
      });
      summary.new += 1;
      continue;
    }

    matchedIds.add(existing.id);

    const changed =
      existing.price_per_kilo !== row.pricePerKilo || existing.unit_price !== row.unitPrice;

    if (changed) {
      items.push({
        action: "update",
        productId: existing.id,
        brand: row.brand,
        description: row.description,
        supplierName: row.supplierName,
        pricePerKilo: row.pricePerKilo,
        unitPrice: row.unitPrice,
        previousPricePerKilo: existing.price_per_kilo,
        previousUnitPrice: existing.unit_price,
      });
      summary.modified += 1;
    } else {
      summary.unchanged += 1;
    }
  }

  for (const p of existingProducts) {
    if (!matchedIds.has(p.id)) {
      items.push({
        action: "remove",
        productId: p.id,
        brand: p.brand,
        description: p.description,
        supplierName: p.supplier_name,
        pricePerKilo: null,
        unitPrice: null,
        previousPricePerKilo: p.price_per_kilo,
        previousUnitPrice: p.unit_price,
      });
      summary.removed += 1;
    }
  }

  return { items, summary };
}
