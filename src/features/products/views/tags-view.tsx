import { Hash } from "lucide-react";
import { listTagsWithCounts, searchProducts } from "@/features/products/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { BrowseTabs } from "@/features/products/components/browse-tabs";
import { SimpleTileGrid } from "@/features/products/components/simple-tile-grid";
import { ProductSearchResults } from "@/features/products/components/product-search-results";

/**
 * Listado de tags para navegar sin escribir. Igual que BrandsBrowseView: si
 * hay `q` se muestra la busqueda de productos en todo el catalogo en vez de
 * ignorar el termino tipeado en el SearchBox.
 */
export async function TagsBrowseView({
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
      <BrowseTabs active="tag" basePath={basePath} />
      {q ? (
        <ProductSearchResults
          products={(await searchProducts({ query: q })).products}
          q={q}
          basePath={basePath}
          isOwner={isOwner}
        />
      ) : (
        <SimpleTileGrid
          items={(await listTagsWithCounts()).map((t) => ({ id: t.tag, name: `#${t.tag}`, count: t.count }))}
          basePath={`${basePath}/tag`}
          icon={Hash}
          emptyLabel="Todavia no hay productos con tags cargados."
        />
      )}
    </div>
  );
}
