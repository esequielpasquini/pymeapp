import Link from "next/link";
import { searchProducts } from "@/features/products/queries";
import { listCategoriesWithCounts } from "@/features/categories/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { CategoryGrid } from "@/features/products/components/category-grid";
import { CategoryIcon } from "@/features/categories/components/category-icon";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Productos</h1>
        <p className="text-sm text-muted-foreground">
          {q ? "Resultados de la busqueda" : "Elegi una categoria para ver sus productos"}
        </p>
      </div>
      <Button asChild>
        <Link href="/products/new">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo producto
        </Link>
      </Button>
    </div>
  );

  // Sin busqueda activa: en vez de listar todos los productos, se muestran
  // tiles grandes de categoria (misma idea que el buscador del empleado).
  // Al clickear una categoria se ve la tabla de productos de esa categoria
  // en /products/category/[id], con edicion y todo lo que ya tenia esta
  // pantalla.
  if (!q) {
    const categories = await listCategoriesWithCounts();
    return (
      <div className="space-y-6">
        {header}
        <SearchBox />
        <CategoryGrid categories={categories} basePath="/products/category" />
      </div>
    );
  }

  const { products, total, pageSize } = await searchProducts({
    query: q,
    page: page ? Number(page) : 1,
  });

  const currentPage = page ? Number(page) : 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      {header}

      <SearchBox />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descripcion</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead className="text-right">Precio unitario</TableHead>
            <TableHead className="text-right">Precio kg/m/L</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="cursor-pointer">
              <TableCell>
                <Link href={`/products/${product.id}`} className="hover:underline">
                  {product.description}
                </Link>
              </TableCell>
              <TableCell>{product.brand ?? "—"}</TableCell>
              <TableCell>
                {product.category ? (
                  <span className="flex items-center gap-1.5 text-sm">
                    <CategoryIcon icon={product.category.icon} className="h-4 w-4" />
                    {product.category.name}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{product.supplier?.name ?? "—"}</TableCell>
              <TableCell className="text-right">
                {product.unit_price !== null ? formatCurrency(product.unit_price) : "—"}
              </TableCell>
              <TableCell className="text-right">
                {product.price_per_kilo !== null ? formatCurrency(product.price_per_kilo) : "—"}
              </TableCell>
            </TableRow>
          ))}
          {products.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                No se encontraron productos.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} asChild variant={p === currentPage ? "default" : "outline"} size="sm">
              <Link href={`/products?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${p}`}>{p}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
