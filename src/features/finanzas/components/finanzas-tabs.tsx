"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/finanzas", label: "Resultados" },
  { href: "/finanzas/planillas", label: "Cuaderno" },
  { href: "/finanzas/tarjetas", label: "Tarjetas" },
  { href: "/finanzas/facturas", label: "Facturas" },
  { href: "/finanzas/gastos", label: "Gastos" },
];

export function FinanzasTabs() {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 md:mx-0 md:px-0">
      {TABS.map(({ href, label }) => {
        const active = href === "/finanzas" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
