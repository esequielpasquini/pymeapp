import Link from "next/link";
import { LayoutGrid, Tag, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "category", label: "Categoria", href: "/search", icon: LayoutGrid },
  { key: "brand", label: "Marca", href: "/search/brands", icon: Tag },
  { key: "supplier", label: "Proveedor", href: "/search/suppliers", icon: Truck },
] as const;

/**
 * Tabs para elegir como navegar el catalogo sin escribir: por categoria (ya
 * existia), por marca o por proveedor. Viven arriba del buscador en las 3
 * pantallas de "sin busqueda activa" del empleado.
 */
export function BrowseTabs({ active }: { active: "category" | "brand" | "supplier" }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {TABS.map((tab) => {
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
