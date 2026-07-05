import { Truck } from "lucide-react";
import { listSuppliersWithCounts } from "@/features/suppliers/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { BrowseTabs } from "@/features/products/components/browse-tabs";
import { SimpleTileGrid } from "@/features/products/components/simple-tile-grid";

export async function SuppliersBrowseView({ basePath }: { basePath: string }) {
  const suppliers = await listSuppliersWithCounts();

  return (
    <div className="mx-auto max-w-2xl space-y-6 md:max-w-4xl lg:max-w-5xl">
      <SearchBox placeholder="Que estas buscando?" />
      <BrowseTabs active="supplier" basePath={basePath} />
      <SimpleTileGrid
        items={suppliers.map((s) => ({ id: s.id, name: s.name, count: s.product_count ?? 0 }))}
        basePath={`${basePath}/supplier`}
        icon={Truck}
        emptyLabel="Todavia no hay proveedores cargados."
      />
    </div>
  );
}
