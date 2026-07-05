import Link from "next/link";
import { searchProducts } from "@/features/products/queries";
import { listCategoriesWithCounts } from "@/features/categories/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { CategoryGrid } from "@/features/products/components/category-grid";
import { BrowseTabs } from "@/features/products/components/browse-tabs";
import { Button } from "@/components/ui/button";
import { ProductTable } from "@/features/products/components/product-table";
import { Plus } from "lucide-react";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Productos</h1>
        <p className="text-sm text-muted-foreground">
          {q ? "Resultados de la busqueda" : "Elegi una categoria para ver sus productos"}
        </p>
      </div>
      <Button asChild>
        <Link href="/products/new">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo producto
        </Link>
      </Button>
    </div>
  );

  // Sin busqueda activa: en vez de listar todos los productos, se muestran
  // tiles grandes de categoria (misma idea que el buscador del empleado).
  // Al clickear una categoria se ve la tabla de productos de esa categoria
  // en /products/category/[id], con edicion y todo lo que ya tenia esta
  // pantalla.
  if (!q) {
    const categories = await listCategoriesWithCounts();
    return (
      <div className="space-y-6">
        {header}
        <SearchBox />
        <BrowseTabs active="category" basePath="/products" />
        <CategoryGrid categories={categories} basePath="/products/category" />
      </div>
    );
  }

  const { products, total, pageSize } = await searchProducts({
    query: q,
    page: page ? Number(page) : 1,
  });

  const currentPage = page ? Number(page) : 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      {header}

      <SearchBox />

      <ProductTable products={products} showCategory />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} asChild variant={p === currentPage ? "default" : "outline"} size="sm">
              <Link href={`/products?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${p}`}>{p}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
