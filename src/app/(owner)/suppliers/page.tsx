import { listSuppliersWithCounts } from "@/features/suppliers/queries";
import { NewSupplierDialog } from "@/features/suppliers/components/new-supplier-dialog";
import { EditSupplierDialog } from "@/features/suppliers/components/edit-supplier-dialog";
import { Card, CardContent } from "@/components/ui/card";

export default async function SuppliersPage() {
  const suppliers = await listSuppliersWithCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Proveedores</h1>
          <p className="text-sm text-muted-foreground">
            Se usan para asociar cada producto a quien lo provee. Elegi uno de la lista
            al dar de alta un producto.
          </p>
        </div>
        <NewSupplierDialog />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => (
          <Card key={supplier.id}>
            <CardContent className="flex items-center justify-between gap-3 pt-6">
              <div>
                <p className="font-medium">{supplier.name}</p>
                <p className="text-xs text-muted-foreground">
                  {supplier.product_count ?? 0} productos
                </p>
              </div>
              <EditSupplierDialog supplier={supplier} />
            </CardContent>
          </Card>
        ))}
        {suppliers.length === 0 && (
          <p className="text-sm text-muted-foreground">Todavia no creaste ningun proveedor.</p>
        )}
      </div>
    </div>
  );
}
