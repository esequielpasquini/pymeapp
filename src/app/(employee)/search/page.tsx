import Link from "next/link";
import { searchProducts } from "@/features/products/queries";
import { listCategoriesWithCounts } from "@/features/categories/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { ProductResultCard } from "@/features/products/components/product-result-card";
import { CategoryGrid } from "@/features/products/components/category-grid";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default async function EmployeeSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  // Sin busqueda activa: en vez de listar todos los productos, se muestra
  // una grilla de categorias (iconos grandes) para navegar por rubro. El
  // buscador de arriba se mantiene igual en ambos casos.
  if (!q) {
    const categories = await listCategoriesWithCounts();
    return (
      <div className="mx-auto max-w-2xl space-y-6 md:max-w-4xl lg:max-w-5xl">
        <SearchBox placeholder="Que estas buscando?" />
        <CategoryGrid categories={categories} basePath="/search/category" />
        <div className="pt-2 text-center">
          <Button asChild variant="outline" size="lg" className="md:h-12 md:px-6 md:text-base">
            <Link href="/search/report">
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

      {products.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center md:p-8">
          <p className="mb-3 text-sm text-muted-foreground md:text-base">
            No encontramos &quot;{q}&quot;. Faltaba en el sistema?
          </p>
          <Button asChild size="lg" className="md:h-12 md:px-6 md:text-base">
            <Link href={`/search/report?name=${encodeURIComponent(q)}`}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Reportar faltante
            </Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {products.map((product) => (
          <ProductResultCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
