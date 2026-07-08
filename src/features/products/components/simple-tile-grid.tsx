import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { buildFilterHref, type ProductFilters } from "@/features/products/filters";

export type TileItem = { id: string; name: string; count: number };

/**
 * Grilla de tiles generica (mismo look que CategoryGrid) para navegar por
 * marca, proveedor o tag sin escribir nada. `filterKey` indica que campo de
 * ProductFilters completa cada tile -- tocar uno agrega ese filtro sobre los
 * demas ya aplicados (`filters`), sin perderlos (ver buildFilterHref).
 */
export function SimpleTileGrid({
  items,
  basePath,
  filters,
  filterKey,
  icon: Icon,
  emptyLabel,
}: {
  items: TileItem[];
  basePath: string;
  filters: ProductFilters;
  filterKey: "brand" | "supplier" | "tag";
  icon: LucideIcon;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
      {items.map((item) => {
        const overrides: Partial<ProductFilters> = { browse: undefined };
        overrides[filterKey] = item.id;
        return (
        <Link
          key={item.id}
          href={buildFilterHref(basePath, filters, overrides)}
          className="flex flex-col items-center gap-2 rounded-xl border border-border p-6 text-center transition-colors hover:bg-muted/50 active:scale-[0.97] active:bg-muted md:gap-3 md:p-8"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary md:h-20 md:w-20">
            <Icon className="h-8 w-8 md:h-10 md:w-10" />
          </div>
          <div>
            <p className="font-medium leading-snug md:text-lg">{item.name}</p>
            <p className="text-xs text-muted-foreground md:text-sm">{item.count} productos</p>
          </div>
        </Link>
        );
      })}
    </div>
  );
}
