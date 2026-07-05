import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { searchProducts } from "@/features/products/queries";
import { getCategory } from "@/features/categories/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { CategoryIcon } from "@/features/categories/components/category-icon";
import { Button } from "@/components/ui/button";
import { ProductTable } from "@/features/products/components/product-table";

export default async function ProductsByCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { id } = await params;
  const { q, page } = await searchParams;

  const category = await getCategory(id);
  if (!category) notFound();

  const { products, total, pageSize } = await searchProducts({
    categoryId: id,
    query: q,
    page: page ? Number(page) : 1,
  });

  const currentPage = page ? Number(page) : 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a categorias
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <CategoryIcon icon={category.icon} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{category.name}</h1>
            <p className="text-sm text-muted-foreground">{total} productos</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/products/new?categoryId=${category.id}`}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      <SearchBox />

      <ProductTable products={products} emptyMessage="Esta categoria todavia no tiene productos." />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} asChild variant={p === currentPage ? "default" : "outline"} size="sm">
              <Link href={`/products/category/${id}?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${p}`}>
                {p}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
