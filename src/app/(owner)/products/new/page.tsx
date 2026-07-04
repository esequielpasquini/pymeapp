import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProductForm } from "@/features/products/components/product-form";
import { createProduct } from "@/features/products/actions";
import { listCategories } from "@/features/categories/queries";
import { listSuppliers } from "@/features/suppliers/queries";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const [{ categoryId }, categories, suppliers] = await Promise.all([
    searchParams,
    listCategories(),
    listSuppliers(),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo producto</h1>
      <Card>
        <CardHeader>
          <CardTitle>Datos del producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            action={createProduct}
            categories={categories}
            suppliers={suppliers}
            defaultCategoryId={categoryId}
            submitLabel="Crear producto"
          />
        </CardContent>
      </Card>
    </div>
  );
}
