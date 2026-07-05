import Link from "next/link";
import { LayoutGrid, Tag, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tabs para elegir como navegar el catalogo sin escribir: por categoria (ya
 * existia), por marca o por proveedor. `basePath` permite reusar el mismo
 * componente en el buscador del empleado (/search) y en el listado de
 * productos del dueño (/products) -- cada uno arma sus propias sub-rutas
 * (`${basePath}/brands`, `${basePath}/suppliers`) a partir de el.
 */
export function BrowseTabs({
  active,
  basePath = "/search",
}: {
  active: "category" | "brand" | "supplier";
  basePath?: string;
}) {
  const tabs = [
    { key: "category", label: "Categoria", href: basePath, icon: LayoutGrid },
    { key: "brand", label: "Marca", href: `${basePath}/brands`, icon: Tag },
    { key: "supplier", label: "Proveedor", href: `${basePath}/suppliers`, icon: Truck },
  ] as const;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
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
