"use client";

import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Category } from "@/lib/supabase/types";
import type { BrandCount } from "@/features/products/queries";

/**
 * Filtros del listado de precios: categoria y marca, como query params
 * (?category=<id>&brand=<nombre>) para que la URL sea compartible/imprimible
 * con el filtro ya aplicado. Radix Select no soporta un valor "vacio" real
 * (rompe con value=""), asi que "todas" se representa con un sentinel y se
 * traduce a "sacar el param" antes de navegar.
 */
const ALL = "__all__";

export function ReportFilters({
  categories,
  brands,
  category,
  brand,
}: {
  categories: Category[];
  brands: BrandCount[];
  category?: string;
  brand?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function updateParam(key: "category" | "brand", value: string) {
    const params = new URLSearchParams();
    if (key === "category") {
      if (value !== ALL) params.set("category", value);
      if (brand) params.set("brand", brand);
    } else {
      if (category) params.set("category", category);
      if (value !== ALL) params.set("brand", value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
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
          onClick={() => router.push(pathname)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Limpiar
        </button>
      )}
    </div>
  );
}
