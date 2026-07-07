import { Truck } from "lucide-react";
import { listSuppliersWithCounts } from "@/features/suppliers/queries";
import { searchProducts } from "@/features/products/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { BrowseTabs } from "@/features/products/components/browse-tabs";
import { SimpleTileGrid } from "@/features/products/components/simple-tile-grid";
import { ProductSearchResults } from "@/features/products/components/product-search-results";

/**
 * Listado de proveedores para navegar sin escribir. Igual que
 * BrandsBrowseView: si hay `q` se muestra la busqueda de productos en todo
 * el catalogo en vez de ignorar el termino tipeado en el SearchBox.
 */
export async function SuppliersBrowseView({
  q,
  basePath,
  isOwner = false,
}: {
  q?: string;
  basePath: string;
  isOwner?: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 md:max-w-4xl lg:max-w-5xl">
      <SearchBox placeholder="Que estas buscando?" />
      <BrowseTabs active="supplier" basePath={basePath} />
      {q ? (
        <ProductSearchResults
          products={(await searchProducts({ query: q })).products}
          q={q}
          basePath={basePath}
          isOwner={isOwner}
        />
      ) : (
        <SimpleTileGrid
          items={(await listSuppliersWithCounts()).map((s) => ({
            id: s.id,
            name: s.name,
            count: s.product_count ?? 0,
          }))}
          basePath={`${basePath}/supplier`}
          icon={Truck}
          emptyLabel="Todavia no hay proveedores cargados."
        />
      )}
    </div>
  );
}
