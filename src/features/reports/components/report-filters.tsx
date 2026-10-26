"use client";

import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Category } from "@/lib/supabase/types";
import type { BrandCount } from "@/features/products/queries";

/**
 * Filtros del listado de precios: categoria y marca, como query params
 * (?category=<id>&brand=<nombre>) para que la URL sea compartible/imprimible
 * con el filtro ya aplicado. Radix Select no soporta un valor "vacio" real
 * (rompe con value=""), asi que "todas" se representa con un sentinel y se
 * traduce a "sacar el param" antes de navegar.
 *
 * ?fechas=no oculta la "(Ultima modificacion: ...)" de cada producto, en
 * pantalla y al imprimir. Va en la URL como los filtros, asi se mantiene al
 * cambiar de categoria/marca y al limpiar los filtros.
 */
const ALL = "__all__";

export function ReportFilters({
  categories,
  brands,
  category,
  brand,
  showDates,
}: {
  categories: Category[];
  brands: BrandCount[];
  category?: string;
  brand?: string;
  showDates: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function navigate(next: { category?: string; brand?: string; showDates: boolean }) {
    const params = new URLSearchParams();
    if (next.category) params.set("category", next.category);
    if (next.brand) params.set("brand", next.brand);
    if (!next.showDates) params.set("fechas", "no");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function updateParam(key: "category" | "brand", value: string) {
    const picked = value === ALL ? undefined : value;
    navigate({
      category: key === "category" ? picked : category,
      brand: key === "brand" ? picked : brand,
      showDates,
    });
  }

  const hasFilters = Boolean(category || brand);

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Select value={category ?? ALL} onValueChange={(v) => updateParam("category", v)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas las categorias</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={brand ?? ALL} onValueChange={(v) => updateParam("brand", v)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Marca" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas las marcas</SelectItem>
          {brands.map((b) => (
            <SelectItem key={b.brand} value={b.brand}>
              {b.brand}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => navigate({ showDates })}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Limpiar
        </button>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={showDates}
        onClick={() => navigate({ category, brand, showDates: !showDates })}
        className="ml-auto inline-flex items-center gap-2 text-sm"
      >
        <span
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
            showDates ? "bg-primary" : "bg-muted-foreground/30"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
              showDates ? "translate-x-[1.125rem]" : "translate-x-0.5"
            )}
          />
        </span>
        Mostrar última modificación
      </button>
    </div>
  );
}
