import Link from "next/link";
import { buildFilterHref, type ProductFilters } from "@/features/products/filters";

/** `color`: franja a la izquierda, mismo criterio que ProductResultCard (solo
 * marcas lo usan, con su color persistido en brand_colors). */
export type TileItem = { id: string; name: string; count: number; color?: string };

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
            className="relative flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50 md:px-5 md:py-3.5"
          >
            {item.color && (
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1"
                style={{ backgroundColor: item.color }}
              />
            )}
            <span className="truncate font-semibold md:text-lg">{item.name}</span>
            <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground md:text-sm">
              {item.count.toLocaleString("es-AR")} productos
            </span>
          </Link>
        );
      })}
    </div>
  );
}
