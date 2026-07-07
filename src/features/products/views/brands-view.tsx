import { Tag } from "lucide-react";
import { listBrandsWithCounts, searchProducts } from "@/features/products/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { BrowseTabs } from "@/features/products/components/browse-tabs";
import { SimpleTileGrid } from "@/features/products/components/simple-tile-grid";
import { ProductSearchResults } from "@/features/products/components/product-search-results";

/**
 * Listado de marcas para navegar sin escribir. El SearchBox de arriba se
 * mantiene visible siempre (ver BrowseTabs/SearchHomeView) -- si el usuario
 * tipea algo, en vez de ignorarlo (como pasaba antes) se muestra el mismo
 * resultado de busqueda que en /search o /products, buscando en TODO el
 * catalogo y no solo dentro de esta sub-seccion: la busqueda tiene que
 * funcionar igual sin importar que tab (Categoria/Marca/Proveedor/Tags)
 * este activo.
 */
export async function BrandsBrowseView({
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
      <BrowseTabs active="brand" basePath={basePath} />
      {q ? (
        <ProductSearchResults
          products={(await searchProducts({ query: q })).products}
          q={q}
          basePath={basePath}
          isOwner={isOwner}
        />
      ) : (
        <SimpleTileGrid
          items={(await listBrandsWithCounts()).map((b) => ({ id: b.brand, name: b.brand, count: b.count }))}
          basePath={`${basePath}/brand`}
          icon={Tag}
          emptyLabel="Todavia no hay productos con marca cargada."
        />
      )}
    </div>
  );
}
