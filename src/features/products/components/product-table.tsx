import Link from "next/link";
import { CategoryIcon } from "@/features/categories/components/category-icon";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/supabase/types";

/**
 * Listado de productos para las pantallas del dueño (/products,
 * /products/category/[id]). En mobile, una tabla de 5-6 columnas no entra en
 * pantalla y obliga a hacer scroll horizontal para ver precio/proveedor --
 * por eso debajo de `md` se muestra como tarjetas apiladas (mismo patron que
 * el buscador del empleado) y recien de `md` para arriba se usa la tabla.
 */
export function ProductTable({
  products,
  showCategory = false,
  emptyMessage = "No se encontraron productos.",
}: {
  products: Product[];
  showCategory?: boolean;
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      {/* Mobile/tablet chico: tarjetas apiladas, todo visible sin scroll horizontal. */}
      <div className="space-y-3 md:hidden">
        {products.map((product) => {
          const hasPrice = product.unit_price !== null || product.price_per_kilo !== null;
          return (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/50 active:bg-muted"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-medium leading-snug">
                    {product.brand ? `${product.brand} — ` : ""}
                    {product.description}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    {showCategory && product.category && (
                      <span className="inline-flex items-center gap-1">
                        <CategoryIcon icon={product.category.icon} className="h-3.5 w-3.5" />
                        {product.category.name}
                      </span>
                    )}
                    {product.supplier?.name && <span>{product.supplier.name}</span>}
                  </div>
                  {product.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {product.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {product.unit_price !== null && (
                    <p className="font-semibold">{formatCurrency(product.unit_price)}</p>
                  )}
                  {product.price_per_kilo !== null && (
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(product.price_per_kilo)}/kg
                    </p>
                  )}
                  {!hasPrice && <p className="text-xs text-muted-foreground">Sin precio</p>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* De md para arriba: tabla completa. */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripcion</TableHead>
              <TableHead>Marca</TableHead>
              {showCategory && <TableHead>Categoria</TableHead>}
              <TableHead>Proveedor</TableHead>
              <TableHead>Tags</TableHead>
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
                {showCategory && (
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
                )}
                <TableCell>{product.supplier?.name ?? "—"}</TableCell>
                <TableCell>
                  {product.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {product.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/products/tag/${encodeURIComponent(tag)}`}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {product.unit_price !== null ? formatCurrency(product.unit_price) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {product.price_per_kilo !== null ? formatCurrency(product.price_per_kilo) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
