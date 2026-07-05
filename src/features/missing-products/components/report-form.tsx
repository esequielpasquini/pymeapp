"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { createReport, type ReportFormState } from "@/features/missing-products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, X } from "lucide-react";

const initialState: ReportFormState = { error: null };

type Suggestion = { id: string; brand: string | null; description: string; supplierName: string | null };

function suggestionLabel(s: { brand: string | null; description: string }): string {
  return s.brand ? `${s.brand} — ${s.description}` : s.description;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full md:h-12 md:text-base" disabled={pending}>
      {pending ? "Enviando..." : "Enviar reporte"}
    </Button>
  );
}

/**
 * Reportar un faltante admite dos caminos: elegir un producto que ya existe
 * en el catalogo (queda asociado por id, para "esto se quedo sin stock") o
 * escribir el nombre a mano si todavia no esta cargado. El input de texto
 * dispara un autocomplete contra /api/products/search-lite; si el empleado
 * elige una sugerencia se fija el producto, si no, lo que haya tipeado se
 * manda tal cual como texto libre.
 */
export function ReportForm({
  defaultName,
  defaultProduct,
  backHref = "/search",
}: {
  defaultName?: string;
  defaultProduct?: { id: string; brand: string | null; description: string } | null;
  /** A donde vuelve el link de "Volver a la búsqueda" tras confirmar -- este
   * formulario se usa tanto desde /search (empleado) como desde /products
   * (dueño). */
  backHref?: string;
}) {
  const [state, formAction] = useFormState(createReport, initialState);
  const [query, setQuery] = useState(
    defaultProduct ? suggestionLabel(defaultProduct) : defaultName ?? ""
  );
  const [selected, setSelected] = useState<Suggestion | null>(
    defaultProduct ? { ...defaultProduct, supplierName: null } : null
  );
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const skipNextFetch = useRef(Boolean(defaultProduct));

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    if (selected) return;
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search-lite?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setSuggestions(data.products ?? []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selected]);

  if (state.success) {
    return (
      <div className="space-y-4 rounded-lg border border-border p-4 text-center md:p-6">
        <p className="text-sm md:text-base">¡Gracias! Le avisamos al dueño.</p>
        <Button asChild variant="outline" className="md:h-12 md:text-base">
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la búsqueda
          </Link>
        </Button>
      </div>
    );
  }

  function selectSuggestion(s: Suggestion) {
    setSelected(s);
    skipNextFetch.current = true;
    setQuery(suggestionLabel(s));
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function clearSelection() {
    setSelected(null);
    setQuery("");
    setSuggestions([]);
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" value={selected?.id ?? ""} />
      <div className="space-y-2">
        <Label htmlFor="productName" className="md:text-base">
          ¿Qué producto faltaba? *
        </Label>
        {selected ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-2.5 md:h-12 md:px-4">
            <input type="hidden" name="productName" value={query} />
            <span className="truncate text-sm md:text-base">{query}</span>
            <button
              type="button"
              onClick={clearSelection}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Quitar producto seleccionado"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Input
              id="productName"
              name="productName"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Busca en el catalogo o escribi el nombre"
              required
              autoFocus
              autoComplete="off"
              className="md:h-12 md:text-base"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-background shadow-md">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={() => selectSuggestion(s)}
                    className="flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/50"
                  >
                    <span className="font-medium">{suggestionLabel(s)}</span>
                    {s.supplierName && (
                      <span className="text-xs text-muted-foreground">{s.supplierName}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {selected
            ? "Producto del catálogo seleccionado."
            : "Si aparece en la lista, elegilo. Si no está, solo escribí el nombre."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment" className="md:text-base">
          Comentario (opcional)
        </Label>
        <Input
          id="comment"
          name="comment"
          placeholder="ej: cliente pidió 20 unidades"
          className="md:h-12 md:text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="photo" className="md:text-base">
          Foto (opcional)
        </Label>
        <Input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          capture="environment"
          className="md:h-12 md:text-base"
        />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
