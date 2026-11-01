"use client";

import { useState } from "react";
import { parseBarcodes } from "@/lib/barcode";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Codigos de barras del producto (N por producto, ver
 * 0025_product_barcodes.sql). Cada lectura del lector USB -- que tipea el
 * codigo y termina con Enter -- se agrega a la lista en vez de enviar el
 * formulario; tambien se puede tipear y tocar "Agregar", o pegar varios
 * separados por coma. Viaja al server action como un solo campo
 * "barcodes" (uno por linea), que valida resolveBarcodes en actions.ts.
 */
export function BarcodesInput({ defaultValue }: { defaultValue: string[] }) {
  const [codes, setCodes] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addDraft() {
    const { codes: parsed, invalid } = parseBarcodes(draft);
    if (invalid.length > 0) {
      setError(`"${invalid[0]}" no es un código válido (solo letras, números y guiones).`);
      return;
    }
    setError(null);
    if (parsed.length === 0) return;
    setCodes((prev) => [...prev, ...parsed.filter((code) => !prev.includes(code))]);
    setDraft("");
  }

  function remove(code: string) {
    setCodes((prev) => prev.filter((c) => c !== code));
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="barcodes" value={codes.join("\n")} />

      {codes.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {codes.map((code) => (
            <li
              key={code}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 py-1 pl-2.5 pr-1 font-mono text-sm tabular-nums"
            >
              {code}
              <button
                type="button"
                onClick={() => remove(code)}
                aria-label={`Quitar código ${code}`}
                className="rounded px-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-700"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          id="barcodes"
          autoComplete="off"
          value={draft}
          placeholder={codes.length > 0 ? "Escaneá otro código..." : "Escanealo con el lector o escribilo"}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            // El lector termina cada lectura con Enter: se agrega a la lista
            // en vez de enviar el formulario.
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            }
          }}
          // Si se tipeo un codigo y se paso a otro campo sin tocar "Agregar",
          // no se pierde.
          onBlur={() => {
            if (draft.trim()) addDraft();
          }}
        />
        <Button type="button" variant="outline" onClick={addDraft} disabled={!draft.trim()}>
          Agregar
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
