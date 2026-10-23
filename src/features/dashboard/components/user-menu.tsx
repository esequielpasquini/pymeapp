"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, ShieldCheck, Store } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Menu desplegable al tocar el nombre del negocio/usuario en el header.
 * Para el dueño ofrece cambiar entre modo admin y modo vendedor (ver
 * features/seller-mode); para todos, cerrar sesion. Las acciones son server
 * actions en <form>, asi funcionan igual que el boton de logout de siempre.
 */
export function UserMenu({
  children,
  mode,
  onEnterSellerMode,
  onExitSellerMode,
  onLogout,
  align = "left",
  className,
}: {
  /** El bloque de marca (OrgBrand) que hace de disparador. */
  children: React.ReactNode;
  /** Solo para el dueño: en que modo esta ahora. Sin esto, el menu solo
   * tiene "Cerrar sesion". */
  mode?: "admin" | "seller";
  onEnterSellerMode?: () => void;
  onExitSellerMode?: () => void;
  onLogout: () => void;
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    function handlePointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const itemClass =
    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none";

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full min-w-0 items-center gap-1.5 rounded-lg p-1 text-left hover:bg-muted/60"
      >
        <div className="min-w-0 flex-1">{children}</div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-50 mt-1 w-56 rounded-lg border border-border bg-background p-1 shadow-lg",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {mode === "admin" && onEnterSellerMode && (
            <form action={onEnterSellerMode}>
              <button type="submit" role="menuitem" className={itemClass}>
                <Store className="h-4 w-4 text-muted-foreground" />
                <span>
                  Modo vendedor
                  <span className="block text-xs text-muted-foreground">Solo el buscador de productos</span>
                </span>
              </button>
            </form>
          )}
          {mode === "seller" && onExitSellerMode && (
            <form action={onExitSellerMode}>
              <button type="submit" role="menuitem" className={itemClass}>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span>
                  Volver a modo admin
                  <span className="block text-xs text-muted-foreground">Panel y todas las funciones</span>
                </span>
              </button>
            </form>
          )}
          {mode && <div className="my-1 border-t border-border" />}
          <form action={onLogout}>
            <button type="submit" role="menuitem" className={cn(itemClass, "text-muted-foreground")}>
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
