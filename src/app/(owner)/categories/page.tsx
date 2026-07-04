import { listCategoriesWithCounts } from "@/features/categories/queries";
import { NewCategoryDialog } from "@/features/categories/components/new-category-dialog";
import { EditCategoryDialog } from "@/features/categories/components/edit-category-dialog";
import { CategoryIcon } from "@/features/categories/components/category-icon";
import { Card, CardContent } from "@/components/ui/card";

export default async function CategoriesPage() {
  const categories = await listCategoriesWithCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Se usan para organizar el buscador del empleado. Todo producto pertenece a
            una categoria.
          </p>
        </div>
        <NewCategoryDialog />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="flex items-center justify-between gap-3 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <CategoryIcon icon={category.icon} />
                </div>
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {category.product_count ?? 0} productos
                  </p>
                </div>
              </div>
              <EditCategoryDialog category={category} />
            </CardContent>
          </Card>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">Todavia no creaste ninguna categoria.</p>
        )}
      </div>
    </div>
  );
}
