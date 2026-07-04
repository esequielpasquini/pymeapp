import { listSuppliers } from "@/features/products/queries";
import { AdjustmentForm } from "@/features/price-adjustments/components/adjustment-form";

export default async function PriceAdjustmentsPage() {
  const suppliers = await listSuppliers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ajuste masivo de precios</h1>
        <p className="text-sm text-muted-foreground">
          Elegí un proveedor y aplicá un aumento o descuento porcentual a todos sus
          productos activos, con redondeo. Vas a ver una vista previa antes de confirmar.
        </p>
      </div>
      <AdjustmentForm suppliers={suppliers} />
    </div>
  );
}
