import { Hash } from "lucide-react";
import { listTagsWithCounts } from "@/features/products/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { BrowseTabs } from "@/features/products/components/browse-tabs";
import { SimpleTileGrid } from "@/features/products/components/simple-tile-grid";

export default async function ProductsByTagPage() {
  const tags = await listTagsWithCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Productos</h1>
        <p className="text-sm text-muted-foreground">Elegi un tag para ver sus productos</p>
      </div>
      <SearchBox />
      <BrowseTabs active="tag" basePath="/products" />
      <SimpleTileGrid
        items={tags.map((t) => ({ id: t.tag, name: `#${t.tag}`, count: t.count }))}
        basePath="/products/tag"
        icon={Hash}
        emptyLabel="Todavia no hay productos con tags cargados."
      />
    </div>
  );
}
