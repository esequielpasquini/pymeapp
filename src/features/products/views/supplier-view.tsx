import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertCircle, Truck } from "lucide-react";
import { searchProducts } from "@/features/products/queries";
import { getSupplier } from "@/features/suppliers/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { ProductResultCard } from "@/features/products/components/product-result-card";
import { Button } from "@/components/ui/button";

export async function SupplierProductsView({
  id,
  q,
  page,
  basePath,
}: {
  id: string;
  q?: string;
  page?: string;
  basePath: string;
}) {
  const supplier = await getSupplier(id);
  if (!supplier) notFound();

  const { products, total, pageSize } = await searchProducts({
    supplierId: id,
    query: q,
    page: page ? Number(page) : 1,
  });

  const currentPage = page ? Number(page) : 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-2xl space-y-4 md:max-w-4xl lg:max-w-5xl">
      <Link
        href={`${basePath}/suppliers`}
        className="inline-flex items-center gap-1 py-1 text-sm text-muted-foreground hover:text-foreground md:text-base"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a proveedores
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary md:h-14 md:w-14">
          <Truck className="h-6 w-6 md:h-7 md:w-7" />
        </div>
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">{supplier.name}</h1>
          <p className="text-sm text-muted-foreground md:text-base">{total} productos</p>
        </div>
      </div>

      <SearchBox placeholder={`Buscar en ${supplier.name}...`} />

      {q && products.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center md:p-8">
          <p className="mb-3 text-sm text-muted-foreground md:text-base">
            No encontramos &quot;{q}&quot; en {supplier.name}. Faltaba en el sistema?
          </p>
          <Button asChild size="lg" className="md:h-12 md:px-6 md:text-base">
            <Link href={`${basePath}/report?name=${encodeURIComponent(q)}`}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Reportar faltante
            </Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {products.map((product) => (
          <ProductResultCard key={product.id} product={product} reportBasePath={basePath} />
        ))}
        {!q && products.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground md:col-span-2">
            Este proveedor todavia no tiene productos cargados.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              asChild
              variant={p === currentPage ? "default" : "outline"}
              size="default"
              className="h-11 w-11 md:h-12 md:w-12 md:text-base"
            >
              <Link href={`${basePath}/supplier/${id}?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${p}`}>
                {p}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
