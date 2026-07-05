import { Tag } from "lucide-react";
import { listBrandsWithCounts } from "@/features/products/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { BrowseTabs } from "@/features/products/components/browse-tabs";
import { SimpleTileGrid } from "@/features/products/components/simple-tile-grid";

export default async function ProductsByBrandPage() {
  const brands = await listBrandsWithCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Productos</h1>
        <p className="text-sm text-muted-foreground">Elegi una marca para ver sus productos</p>
      </div>
      <SearchBox />
      <BrowseTabs active="brand" basePath="/products" />
      <SimpleTileGrid
        items={brands.map((b) => ({ id: b.brand, name: b.brand, count: b.count }))}
        basePath="/products/brand"
        icon={Tag}
        emptyLabel="Todavia no hay productos con marca cargada."
      />
    </div>
  );
}
