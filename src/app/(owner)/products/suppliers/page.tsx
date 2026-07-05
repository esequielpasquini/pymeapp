import { Truck } from "lucide-react";
import { listSuppliersWithCounts } from "@/features/suppliers/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { BrowseTabs } from "@/features/products/components/browse-tabs";
import { SimpleTileGrid } from "@/features/products/components/simple-tile-grid";

export default async function ProductsBySupplierPage() {
  const suppliers = await listSuppliersWithCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Productos</h1>
        <p className="text-sm text-muted-foreground">Elegi un proveedor para ver sus productos</p>
      </div>
      <SearchBox />
      <BrowseTabs active="supplier" basePath="/products" />
      <SimpleTileGrid
        items={suppliers.map((s) => ({ id: s.id, name: s.name, count: s.product_count ?? 0 }))}
        basePath="/products/supplier"
        icon={Truck}
        emptyLabel="Todavia no hay proveedores cargados."
      />
    </div>
  );
}
