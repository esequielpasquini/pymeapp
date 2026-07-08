"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Buscador con debounce que escribe el término en la URL (?q=...). Así la
 * búsqueda queda en un Server Component (queries.ts) y es enlazable/compartible,
 * sin necesitar un endpoint de API aparte.
 */
export function SearchBox({ placeholder }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      params.delete("page");
      // Escribir un termino de busqueda tiene prioridad sobre cualquier
      // selector de tiles que estuviera abierto (categoria/marca/proveedor/
      // tag) -- se cierra y se muestran resultados directamente.
      params.delete("browse");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 250);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground md:left-4 md:h-5 md:w-5" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? "Buscar por descripción, marca o proveedor..."}
        className="h-12 pl-10 text-base md:h-14 md:pl-12 md:text-lg"
      />
    </div>
  );
}
