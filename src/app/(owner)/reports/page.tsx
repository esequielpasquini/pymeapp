import { listCategories } from "@/features/categories/queries";
import { listBrandsWithCounts, listProductsForReport } from "@/features/products/queries";
import { ReportFilters } from "@/features/reports/components/report-filters";
import { PrintButton } from "@/features/reports/components/print-button";
import { groupProductsByBrand } from "@/features/reports/group-by-brand";
import { formatCurrency } from "@/lib/utils";

/**
 * Lista de precios imprimible: pensada para que el dueño la use como
 * catalogo en papel (proveedores, ferias, etc). Agrupada por marca (orden
 * alfabetico) y, dentro de cada marca, por descripcion. Los filtros y el
 * boton de imprimir se ocultan con la variante "print:" de Tailwind al
 * mandar a imprimir -- solo queda la lista.
 */
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; brand?: string }>;
}) {
  const { category, brand } = await searchParams;

  const [categories, brands, products] = await Promise.all([
    listCategories(),
    listBrandsWithCounts(),
    listProductsForReport({ categoryId: category, brand }),
  ]);

  const groups = groupProductsByBrand(products);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">Reportes</h1>
          <p className="text-sm text-muted-foreground">Lista de precios para imprimir.</p>
        </div>
        <PrintButton />
      </div>

      <ReportFilters categories={categories} brands={brands} category={category} brand={brand} />

      {/* Encabezado que solo se ve al imprimir -- en pantalla ya esta el de arriba. */}
      <div className="hidden print:block">
        <h1 className="text-xl font-semibold">Lista de precios</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay productos que coincidan con el filtro.</p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.brand} className="break-inside-avoid-page">
              <h2 className="mb-2 border-b border-border pb-1 text-lg font-semibold">{group.brand}</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-1 font-medium">Descripción</th>
                    <th className="py-1 text-right font-medium">Precio unitario</th>
                    <th className="py-1 text-right font-medium">Precio por kilo</th>
                  </tr>
                </thead>
                <tbody>
                  {group.products.map((product) => (
                    <tr key={product.id} className="border-t border-border/60">
                      <td className="py-1.5">{product.description}</td>
                      <td className="py-1.5 text-right">
                        {product.unit_price !== null ? formatCurrency(product.unit_price) : "—"}
                      </td>
                      <td className="py-1.5 text-right">
                        {product.price_per_kilo !== null ? formatCurrency(product.price_per_kilo) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
