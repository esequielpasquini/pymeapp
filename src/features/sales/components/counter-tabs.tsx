"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/search", label: "Buscar" },
  { href: "/sell", label: "Vender" },
];

/** Selector Buscar / Vender del header de mostrador (solo con el modulo
 * "ventas" habilitado, ver (employee)/layout.tsx). */
export function CounterTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex shrink-0 rounded-lg bg-muted p-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors md:px-4",
              active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
