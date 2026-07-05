import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ReportForm } from "@/features/missing-products/components/report-form";
import { getProduct } from "@/features/products/queries";

export default async function ReportMissingPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; productId?: string }>;
}) {
  const { name, productId } = await searchParams;

  const product = productId ? await getProduct(productId) : null;

  return (
    <div className="mx-auto max-w-md md:max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="md:text-xl">Reportar faltante</CardTitle>
          <CardDescription className="md:text-base">
            {product
              ? "Le avisamos al dueño que este producto está sin stock."
              : "Le avisamos al dueño para que lo cargue."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportForm
            defaultName={name}
            defaultProduct={
              product ? { id: product.id, brand: product.brand, description: product.description } : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
