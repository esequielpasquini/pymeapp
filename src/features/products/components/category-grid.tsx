import Link from "next/link";
import { CategoryIcon } from "@/features/categories/components/category-icon";
import { buildFilterHref, type ProductFilters } from "@/features/products/filters";
import type { Category } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

// Un color por categoria, mismo lenguaje que los tiles del Panel. Clases
// literales (no armadas con template strings) para que el JIT de Tailwind
// las encuentre.
const TONES = [
  { tile: "border-blue-200 bg-blue-50/60 hover:bg-blue-50", icon: "bg-blue-100 text-blue-700" },
  { tile: "border-violet-200 bg-violet-50/60 hover:bg-violet-50", icon: "bg-violet-100 text-violet-700" },
  { tile: "border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50", icon: "bg-emerald-100 text-emerald-700" },
  { tile: "border-amber-200 bg-amber-50/60 hover:bg-amber-50", icon: "bg-amber-100 text-amber-700" },
  { tile: "border-rose-200 bg-rose-50/60 hover:bg-rose-50", icon: "bg-rose-100 text-rose-700" },
  { tile: "border-cyan-200 bg-cyan-50/60 hover:bg-cyan-50", icon: "bg-cyan-100 text-cyan-700" },
  { tile: "border-orange-200 bg-orange-50/60 hover:bg-orange-50", icon: "bg-orange-100 text-orange-700" },
  { tile: "border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50", icon: "bg-indigo-100 text-indigo-700" },
];

/** Color derivado del id (no de la posicion en la lista): asi una categoria
 * nueva no le cambia el color a las que ya estaban. */
function toneFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return TONES[hash % TONES.length];
}

/**
 * Grilla de iconos grandes de categorias. La usan tanto el buscador del
 * empleado (/search) como el listado de productos del dueno (/products) --
 * en vez de listar todos los productos de una, se navega por categoria.
 * Tocar un tile agrega (o reemplaza) el filtro de categoria sobre los demas
 * filtros ya aplicados (`filters`), sin perderlos -- ver buildFilterHref.
 */
export function CategoryGrid({
  categories,
  basePath,
  filters,
}: {
  categories: Category[];
  basePath: string;
  filters: ProductFilters;
}) {
  if (categories.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Todavia no hay categorias cargadas.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
      {categories.map((category) => {
        const tone = toneFor(category.id);
        return (
          <Link
            key={category.id}
            href={buildFilterHref(basePath, filters, { category: category.id, browse: undefined })}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-6 text-center transition-all hover:shadow-md active:scale-[0.97] md:gap-3 md:p-8",
              tone.tile
            )}
          >
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full md:h-20 md:w-20",
                tone.icon
              )}
            >
              <CategoryIcon icon={category.icon} className="h-8 w-8 md:h-10 md:w-10" />
            </div>
            <div>
              <p className="font-semibold leading-snug md:text-lg">{category.name}</p>
              <p className="text-xs text-muted-foreground md:text-sm">
                {(category.product_count ?? 0).toLocaleString("es-AR")} productos
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
