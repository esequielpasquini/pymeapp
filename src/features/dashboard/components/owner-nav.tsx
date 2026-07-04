"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  Upload,
  Percent,
  AlertCircle,
  Settings,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/categories", label: "Categorias", icon: Tags },
  { href: "/suppliers", label: "Proveedores", icon: Truck },
  { href: "/imports", label: "Importar Excel", icon: Upload },
  { href: "/price-adjustments", label: "Ajuste de precios", icon: Percent },
  { href: "/missing-products", label: "Faltantes", icon: AlertCircle },
  { href: "/settings", label: "Configuracion", icon: Settings },
];

export function OwnerNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
