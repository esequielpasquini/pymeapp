"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const FILTER_PARAM_KEYS = ["q", "category", "brand", "supplier", "tag", "browse", "page"];

/**
 * Buscador con debounce que escribe el término en la URL (?q=...). Así la
 * búsqueda queda en un Server Component (queries.ts) y es enlazable/compartible,
 * sin necesitar un endpoint de API aparte.
 *
 * Incluye una "x" para limpiar todo de un toque: no solo el texto tipeado,
 * tambien cualquier filtro de categoria/marca/proveedor/tag que estuviera
 * aplicado -- vuelve a la pantalla de aterrizaje sin nada puesto.
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

  const hasAnythingToClear =
    value.length > 0 || FILTER_PARAM_KEYS.some((key) => searchParams.get(key));

  function handleClear() {
    setValue("");
    startTransition(() => {
      router.replace(pathname);
    });
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground md:left-4 md:h-5 md:w-5" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? "Buscar por descripción, marca o proveedor..."}
        className="h-12 pl-10 pr-10 text-base md:h-14 md:pl-12 md:pr-12 md:text-lg"
      />
      {hasAnythingToClear && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpiar búsqueda y filtros"
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground md:right-3 md:h-9 md:w-9"
        >
          <X className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      )}
    </div>
  );
}
