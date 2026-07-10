import Link from "next/link";
import { buildFilterHref, type ProductFilters } from "@/features/products/filters";

export type TileItem = { id: string; name: string; count: number };

/**
 * Listado (no tiles) para elegir marca o etiqueta -- mismo lenguaje visual
 * que la lista de resultados de productos (filas con divide-y), pedido
 * explicitamente en vez de la grilla de iconos que usa CategoryGrid.
 */
export function SimpleFilterRows({
  items,
  basePath,
  filters,
  filterKey,
  emptyLabel,
}: {
  items: TileItem[];
  basePath: string;
  filters: ProductFilters;
  filterKey: "brand" | "supplier" | "tag";
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
      {items.map((item) => {
        const overrides: Partial<ProductFilters> = { browse: undefined };
        overrides[filterKey] = item.id;
        return (
          <Link
            key={item.id}
            href={buildFilterHref(basePath, filters, overrides)}
            className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50 md:px-5 md:py-3.5"
          >
            <span className="truncate font-medium md:text-lg">{item.name}</span>
            <span className="shrink-0 text-sm text-muted-foreground">{item.count} productos</span>
          </Link>
        );
      })}
    </div>
  );
}
