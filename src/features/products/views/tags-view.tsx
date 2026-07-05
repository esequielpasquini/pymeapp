import { Hash } from "lucide-react";
import { listTagsWithCounts } from "@/features/products/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { BrowseTabs } from "@/features/products/components/browse-tabs";
import { SimpleTileGrid } from "@/features/products/components/simple-tile-grid";

export async function TagsBrowseView({ basePath }: { basePath: string }) {
  const tags = await listTagsWithCounts();

  return (
    <div className="mx-auto max-w-2xl space-y-6 md:max-w-4xl lg:max-w-5xl">
      <SearchBox placeholder="Que estas buscando?" />
      <BrowseTabs active="tag" basePath={basePath} />
      <SimpleTileGrid
        items={tags.map((t) => ({ id: t.tag, name: `#${t.tag}`, count: t.count }))}
        basePath={`${basePath}/tag`}
        icon={Hash}
        emptyLabel="Todavia no hay productos con tags cargados."
      />
    </div>
  );
}
