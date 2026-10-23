"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  ClipboardList,
  Upload,
  Percent,
  AlertCircle,
  Printer,
  Settings,
  ShoppingCart,
} from "lucide-react";

export const OWNER_NAV_LINKS = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/sell", label: "Vender", icon: ShoppingCart },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/categories", label: "Categorias", icon: Tags },
  { href: "/suppliers", label: "Proveedores", icon: Truck },
  { href: "/orders", label: "Pedidos", icon: ClipboardList },
  { href: "/imports", label: "Importar Excel", icon: Upload },
  { href: "/price-adjustments", label: "Ajuste de precios", icon: Percent },
  { href: "/missing-products", label: "Faltantes", icon: AlertCircle },
  { href: "/reports", label: "Reportes", icon: Printer },
  { href: "/settings", label: "Configuracion", icon: Settings },
];

export function OwnerNav({
  onNavigate,
  linkClassName,
  pedidosEnabled,
  ventasEnabled,
}: {
  onNavigate?: () => void;
  linkClassName?: string;
  /** El link a "Pedidos" es el unico condicionado a un modulo togglable
   * (ver features/modules) -- se pasa como boolean desde el layout en vez de
   * importar MODULE_PEDIDOS aca, porque ese modulo vive en un archivo
   * "server-only" que no se puede importar desde un client component. */
  pedidosEnabled: boolean;
  /** Link a la pantalla Vender (modulo "ventas"), mismo criterio. */
  ventasEnabled: boolean;
}) {
  const pathname = usePathname();
  const links = OWNER_NAV_LINKS.filter(
    (link) => (pedidosEnabled || link.href !== "/orders") && (ventasEnabled || link.href !== "/sell")
  );

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              linkClassName
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
