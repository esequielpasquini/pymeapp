import Link from "next/link";
import { Plus } from "lucide-react";
import { SearchHomeView } from "@/features/products/views/search-home-view";
import type { BrowseDimension } from "@/features/products/filters";
import { Button } from "@/components/ui/button";

/**
 * Vista de productos del dueño: la misma experiencia que el buscador del
 * empleado (tiles de categoria/marca/proveedor/tag, sin necesidad de
 * tipear, todos combinables entre si) mas un link de edicion en cada
 * tarjeta. Antes esta pantalla tenia su propia implementacion separada de
 * /ventas -- se unificaron en una sola vista compartida (SearchHomeView)
 * para no mantener dos UIs casi identicas.
 */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    supplier?: string;
    tag?: string;
    browse?: BrowseDimension;
    page?: string;
  }>;
}) {
  const { q, category, brand, supplier, tag, browse, page } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Productos</h1>
          <p className="text-sm text-muted-foreground">Buscá, navegá por categoria/marca/proveedor/tag y editá</p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      <SearchHomeView
        q={q}
        category={category}
        brand={brand}
        supplier={supplier}
        tag={tag}
        browse={browse}
        page={page}
        basePath="/products"
        isOwner
      />
    </div>
  );
}
