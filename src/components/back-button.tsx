"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Link de "Volver" generico que usa el historial del navegador en vez de un
 * href fijo. Pensado para pantallas a las que se puede llegar desde muchos
 * lugares distintos (ej. la ficha de edicion de un producto, alcanzable
 * desde tiles de categoria/marca/proveedor/tag o desde un reporte de
 * faltante) -- un link fijo a un solo "atras" no serviria en todos los casos.
 */
export function BackButton({ label = "Volver" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1 py-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
