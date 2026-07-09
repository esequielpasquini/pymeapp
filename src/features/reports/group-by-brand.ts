import type { ReportProduct } from "@/features/products/queries";

export type BrandGroup = {
  brand: string;
  products: ReportProduct[];
};

/**
 * Agrupa en memoria (no en SQL) porque la marca es texto libre en
 * products.brand -- dos productos pueden tener la "misma" marca con
 * distinta capitalizacion (ej. "Royal Canin" / "royal canin") y hay que
 * tratarlos como un solo grupo, igual que en listBrandsWithCounts. El grupo
 * usa la primera capitalizacion que aparece como etiqueta.
 */
export function groupProductsByBrand(products: ReportProduct[]): BrandGroup[] {
  const groups = new Map<string, BrandGroup>();

  for (const product of products) {
    const trimmed = product.brand?.trim();
    const key = trimmed ? trimmed.toLowerCase() : "__sin_marca__";
    const label = trimmed || "Sin marca";

    let group = groups.get(key);
    if (!group) {
      group = { brand: label, products: [] };
      groups.set(key, group);
    }
    group.products.push(product);
  }

  const result = Array.from(groups.values());
  for (const group of result) {
    group.products.sort((a, b) => a.description.localeCompare(b.description, "es"));
  }
  result.sort((a, b) => {
    if (a.brand === "Sin marca") return 1;
    if (b.brand === "Sin marca") return -1;
    return a.brand.localeCompare(b.brand, "es");
  });

  return result;
}
