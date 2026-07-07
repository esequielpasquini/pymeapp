import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { searchProducts, getMostSearchedProducts } from "@/features/products/queries";
import { listCategoriesWithCounts } from "@/features/categories/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { ProductSearchResults } from "@/features/products/components/product-search-results";
import { CategoryGrid } from "@/features/products/components/category-grid";
import { BrowseTabs } from "@/features/products/components/browse-tabs";
import { MostSearchedRow } from "@/features/products/components/most-searched-row";
import { Button } from "@/components/ui/button";

/**
 * Pantalla principal de "buscar un producto y ver su precio", compartida
 * entre /search (empleado) y /products (dueño) -- son la misma experiencia,
 * solo cambia `basePath` para que los links internos (categorias, marca,
 * proveedor, reportar faltante) queden bajo la seccion correcta, y `isOwner`
 * para mostrar el link de edicion y el boton de WhatsApp solo cuando el
 * dueño la mira desde /products.
 */
export async function SearchHomeView({
  q,
  basePath,
  isOwner = false,
}: {
  q?: string;
  basePath: string;
  isOwner?: boolean;
}) {
  // Sin busqueda activa: en vez de listar todos los productos, se muestra
  // una grilla de categorias (iconos grandes) para navegar por rubro. El
  // buscador de arriba se mantiene igual en ambos casos.
  if (!q) {
    const [categories, mostSearched] = await Promise.all([
      listCategoriesWithCounts(),
      getMostSearchedProducts(),
    ]);
    return (
      <div className="mx-auto max-w-2xl space-y-6 md:max-w-4xl lg:max-w-5xl">
        <SearchBox placeholder="Que estas buscando?" />
        <MostSearchedRow products={mostSearched} />
        <BrowseTabs active="category" basePath={basePath} />
        <CategoryGrid categories={categories} basePath={`${basePath}/category`} />
        <div className="pt-2 text-center">
          <Button asChild variant="outline" size="lg" className="md:h-12 md:px-6 md:text-base">
            <Link href={`${basePath}/report`}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Reportar un producto faltante
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { products } = await searchProducts({ query: q });

  return (
    <div className="mx-auto max-w-2xl space-y-4 md:max-w-4xl lg:max-w-5xl">
      <SearchBox placeholder="Que estas buscando?" />
      <ProductSearchResults products={products} q={q} basePath={basePath} isOwner={isOwner} />
    </div>
  );
}
