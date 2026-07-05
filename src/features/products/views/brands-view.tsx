import { Tag } from "lucide-react";
import { listBrandsWithCounts } from "@/features/products/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { BrowseTabs } from "@/features/products/components/browse-tabs";
import { SimpleTileGrid } from "@/features/products/components/simple-tile-grid";

export async function BrandsBrowseView({ basePath }: { basePath: string }) {
  const brands = await listBrandsWithCounts();

  return (
    <div className="mx-auto max-w-2xl space-y-6 md:max-w-4xl lg:max-w-5xl">
      <SearchBox placeholder="Que estas buscando?" />
      <BrowseTabs active="brand" basePath={basePath} />
      <SimpleTileGrid
        items={brands.map((b) => ({ id: b.brand, name: b.brand, count: b.count }))}
        basePath={`${basePath}/brand`}
        icon={Tag}
        emptyLabel="Todavia no hay productos con marca cargada."
      />
    </div>
  );
}
