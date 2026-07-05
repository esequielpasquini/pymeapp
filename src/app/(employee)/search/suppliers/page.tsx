import { Truck } from "lucide-react";
import { listSuppliersWithCounts } from "@/features/suppliers/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { BrowseTabs } from "@/features/products/components/browse-tabs";
import { SimpleTileGrid } from "@/features/products/components/simple-tile-grid";

export default async function SuppliersBrowsePage() {
  const suppliers = await listSuppliersWithCounts();

  return (
    <div className="mx-auto max-w-2xl space-y-6 md:max-w-4xl lg:max-w-5xl">
      <SearchBox placeholder="Que estas buscando?" />
      <BrowseTabs active="supplier" />
      <SimpleTileGrid
        items={suppliers.map((s) => ({ id: s.id, name: s.name, count: s.product_count ?? 0 }))}
        basePath="/search/supplier"
        icon={Truck}
        emptyLabel="Todavia no hay proveedores cargados."
      />
    </div>
  );
}
