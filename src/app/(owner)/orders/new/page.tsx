import Link from "next/link";
import { redirect } from "next/navigation";
import { getEnabledModules, MODULE_PEDIDOS } from "@/features/modules/queries";
import { listSuppliers, getSupplier } from "@/features/suppliers/queries";
import { listProductsBySupplier } from "@/features/products/queries";
import { OrderForm } from "@/features/orders/components/order-form";

/**
 * Primer paso: elegir proveedor (?supplier= todavia no esta en la url).
 * Segundo paso: con el proveedor elegido, se muestra el formulario de
 * cantidades (OrderForm) con su catalogo activo.
 */
export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ supplier?: string }>;
}) {
  const enabledModules = await getEnabledModules();
  if (!enabledModules.has(MODULE_PEDIDOS)) redirect("/dashboard");

  const { supplier } = await searchParams;

  if (!supplier) {
    const suppliers = await listSuppliers();
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Nuevo pedido</h1>
          <p className="text-sm text-muted-foreground">Elegi el proveedor al que le vas a hacer el pedido.</p>
        </div>
        {suppliers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Todavia no creaste ningun proveedor.</p>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {suppliers.map((s) => (
              <Link
                key={s.id}
                href={`/orders/new?supplier=${s.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50 md:px-5 md:py-3.5"
              >
                <span className="truncate font-medium md:text-lg">{s.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const [supplierObj, products] = await Promise.all([getSupplier(supplier), listProductsBySupplier(supplier)]);
  if (!supplierObj) redirect("/orders/new");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo pedido</h1>
        <p className="text-sm text-muted-foreground">Proveedor: {supplierObj.name}</p>
      </div>
      <OrderForm mode="create" supplierId={supplier} products={products} />
    </div>
  );
}
