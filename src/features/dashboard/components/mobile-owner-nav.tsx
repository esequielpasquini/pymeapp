"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { OwnerNav } from "@/features/dashboard/components/owner-nav";

/**
 * Menu de navegacion para mobile/tablet (debajo de md), donde el aside fijo
 * del dueño esta oculto. Reusa la misma lista de links que el aside de
 * escritorio (OwnerNav) dentro de un drawer que sale desde la izquierda.
 */
export function MobileOwnerNav({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // El layout del dueño no se remonta al navegar entre sus paginas, asi que
  // si no cerramos el drawer a mano al cambiar de ruta queda abierto tapando
  // la pagina nueva.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Abrir menu">
          <Menu className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="left-0 top-0 flex h-full w-72 max-w-[85vw] translate-x-0 translate-y-0 flex-col justify-between rounded-none border-r border-l-0 border-t-0 border-b-0 p-4">
        <div>
          <DialogTitle className="mb-4 px-2 text-sm font-semibold">Menu</DialogTitle>
          <OwnerNav onNavigate={() => setOpen(false)} linkClassName="text-base py-3" />
        </div>
        <form action={onLogout}>
          <Button
            variant="ghost"
            size="lg"
            className="w-full justify-start gap-2 text-base text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
