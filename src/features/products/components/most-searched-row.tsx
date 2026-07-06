import { TrendingUp, ImageIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/supabase/types";

/**
 * Row fijo con los productos mas buscados (ver search_count en products,
 * incrementado desde searchProducts() cada vez que una busqueda puntual
 * encuentra el producto -- ver 0015_product_search_stats.sql). Pensado para
 * que un empleado que atiende el mismo pedido de precio varias veces por dia
 * ("cuanto sale la lata de tal marca") lo tenga a un vistazo sin tener que
 * volver a tipear la busqueda. Scroll horizontal en mobile, nunca mas de 5
 * tiles (limit lo controla getMostSearchedProducts).
 */
export function MostSearchedRow({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <TrendingUp className="h-4 w-4" />
        Más buscados
      </p>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex w-40 shrink-0 flex-col gap-2 rounded-lg border border-border p-3 md:w-48"
          >
            <div className="flex h-16 items-center justify-center overflow-hidden rounded-md bg-muted/30 md:h-20">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image_url} alt={product.description} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="line-clamp-2 text-xs font-medium leading-snug md:text-sm">
              {product.brand ? `${product.brand} — ` : ""}
              {product.description}
            </p>
            <div className="mt-auto rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-center">
              {product.unit_price !== null && (
                <p className="text-sm font-bold text-primary md:text-base">
                  {formatCurrency(product.unit_price)}
                </p>
              )}
              {product.price_per_kilo !== null && (
                <p className="text-[11px] font-medium text-primary/80 md:text-xs">
                  {formatCurrency(product.price_per_kilo)} / kg
                </p>
              )}
              {product.unit_price === null && product.price_per_kilo === null && (
                <p className="text-xs text-muted-foreground">Sin precio</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
