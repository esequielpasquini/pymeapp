import { notFound } from "next/navigation";
import { getProduct, getPriceHistory } from "@/features/products/queries";
import { updateProduct } from "@/features/products/actions";
import { ProductForm } from "@/features/products/components/product-form";
import { PriceHistory } from "@/features/products/components/price-history";
import { listCategories } from "@/features/categories/queries";
import { listSuppliers } from "@/features/suppliers/queries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BackButton } from "@/components/back-button";

// Edicion de producto desde el buscador (empleado o dueño en modo vendedor).
// Igual que (owner)/products/[id] pero sin "Eliminar" -- eso queda solo para
// el dueño (ver 0027_employee_product_edit.sql).
export default async function SearchProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const [history, categories, suppliers] = await Promise.all([
    getPriceHistory(id),
    listCategories(),
    listSuppliers(),
  ]);
  const boundUpdate = updateProduct.bind(null, id);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <BackButton />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Editar producto</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              action={boundUpdate}
              product={product}
              categories={categories}
              suppliers={suppliers}
              submitLabel="Guardar cambios"
              fallbackHref="/search"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de precios</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceHistory changes={history} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
