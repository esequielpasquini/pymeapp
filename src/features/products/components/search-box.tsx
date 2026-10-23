"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  const currentQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(currentQuery);
  const [, startTransition] = useTransition();

  // Si la URL cambia por afuera (se toco un Link -- el tab "Categoria",
  // sacar un chip de filtro, paginacion, etc.) y ya no tiene el mismo `q`,
  // el input tiene que reflejarlo. Sin esto el estado de React quedaba
  // pisado con lo ultimo tipeado aunque la URL ya no tuviera texto de
  // busqueda (ej: tocar "Categoria" volvia a la pantalla de aterrizaje pero
  // el cuadro de busqueda seguia mostrando lo que se habia escrito antes).
  useEffect(() => {
    setValue(currentQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuery]);

  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  // Ultimo termino que ya se mando a la URL. Evita que el debounce vuelva a
  // mandar lo mismo despues de una busqueda inmediata (Enter / lector), lo
  // que duplicaria la busqueda y su registro en search_logs.
  const lastPushedRef = useRef<string | null>(null);

  function pushQuery(query: string) {
    lastPushedRef.current = query;
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("q", query);
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
  }

  useEffect(() => {
    if (value === lastPushedRef.current) return;
    const timeout = setTimeout(() => pushQuery(value), 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Lector de codigo de barras USB: para el navegador es un teclado que
  // tipea el codigo muy rapido (pocos ms entre teclas) y termina con Enter.
  // Se escucha a nivel documento para que funcione aunque el cursor no este
  // en el buscador: al llegar el Enter de una rafaga rapida, el codigo
  // reemplaza lo que hubiera en el cuadro (no se concatena con la busqueda
  // anterior) y se busca en el momento, sin esperar el debounce. Si el foco
  // esta en OTRO campo editable (ej. formulario de producto) no se hace
  // nada, para no robarle la lectura a ese campo.
  useEffect(() => {
    const MAX_GAP_MS = 50;
    const MIN_LENGTH = 4;
    let buffer = "";
    let lastKeyAt = 0;

    function isOtherEditable(target: EventTarget | null) {
      if (!(target instanceof HTMLElement) || target === inputRef.current) return false;
      return (
        target.isContentEditable ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLInputElement && target.type !== "checkbox" && target.type !== "radio")
      );
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (isOtherEditable(e.target)) {
        buffer = "";
        return;
      }
      const now = performance.now();

      if (e.key === "Enter") {
        const isScan = buffer.length >= MIN_LENGTH && now - lastKeyAt <= MAX_GAP_MS * 2;
        if (isScan) {
          e.preventDefault();
          const code = buffer;
          setValue(code);
          pushQuery(code);
          inputRef.current?.blur();
        } else if (e.target === inputRef.current) {
          // Enter tipeado a mano: buscar ya, sin esperar el debounce.
          e.preventDefault();
          pushQuery(valueRef.current);
        }
        buffer = "";
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        buffer = now - lastKeyAt > MAX_GAP_MS ? e.key : buffer + e.key;
        lastKeyAt = now;
      } else if (e.key !== "Shift") {
        buffer = "";
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
    // pushQuery lee searchParams/pathname actuales via closure del render;
    // se re-suscribe cuando cambian.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname]);

  const hasAnythingToClear = value.length > 0 || FILTER_PARAM_KEYS.some((key) => searchParams.get(key));

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
        ref={inputRef}
        enterKeyHint="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? "Que estas buscando?"}
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
