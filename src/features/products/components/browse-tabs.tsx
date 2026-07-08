import Link from "next/link";
import { LayoutGrid, Tag, Truck, Hash, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildFilterHref, type BrowseDimension, type ProductFilters } from "@/features/products/filters";

/**
 * Tabs para elegir por que dimension seguir filtrando: categoria, marca,
 * proveedor o tag. Tocar un tab ABRE el selector de tiles de esa dimension
 * SIN pisar los filtros ya aplicados (ver buildFilterHref) -- se puede
 * categoria + marca + proveedor + tag al mismo tiempo. Se marca como activo
 * tanto el tab que se esta explorando ahora (`browse`) como cualquier
 * dimension que ya tenga un filtro puesto, para que quede claro que esta
 * afectando el resultado.
 */
export function BrowseTabs({
  basePath,
  filters,
}: {
  basePath: string;
  filters: ProductFilters;
}) {
  const tabs: { key: BrowseDimension; label: string; icon: LucideIcon }[] = [
    { key: "category", label: "Categoria", icon: LayoutGrid },
    { key: "brand", label: "Marca", icon: Tag },
    { key: "supplier", label: "Proveedor", icon: Truck },
    { key: "tag", label: "Tags", icon: Hash },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = filters.browse === tab.key || Boolean(filters[tab.key]);
        // "Categoria" funciona como un reinicio: vuelve a la pantalla de
        // aterrizaje sin ningun filtro puesto (categoria es el punto de
        // entrada por rubro). Los otros tabs siguen sumando su selector
        // sobre los filtros ya aplicados.
        const href =
          tab.key === "category" ? basePath : buildFilterHref(basePath, filters, { browse: tab.key });
        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors md:text-base",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted/50"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
