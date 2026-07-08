import Link from "next/link";
import { CategoryIcon } from "@/features/categories/components/category-icon";
import { buildFilterHref, type ProductFilters } from "@/features/products/filters";
import type { Category } from "@/lib/supabase/types";

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
      {categories.map((category) => (
        <Link
          key={category.id}
          href={buildFilterHref(basePath, filters, { category: category.id, browse: undefined })}
          className="flex flex-col items-center gap-2 rounded-xl border border-border p-6 text-center transition-colors hover:bg-muted/50 active:scale-[0.97] active:bg-muted md:gap-3 md:p-8"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary md:h-20 md:w-20">
            <CategoryIcon icon={category.icon} className="h-8 w-8 md:h-10 md:w-10" />
          </div>
          <div>
            <p className="font-medium leading-snug md:text-lg">{category.name}</p>
            <p className="text-xs text-muted-foreground md:text-sm">
              {category.product_count ?? 0} productos
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
