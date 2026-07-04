import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/supabase/types";

function isStale(updatedAt: string): boolean {
  const days = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  return days > 60;
}

/**
 * Tarjeta de resultado pensada para el buscador del empleado: grande, clara,
 * usable desde el celular en el mostrador. Muestra si el precio podría estar
 * desactualizado (más de 60 días sin tocar).
 */
export function ProductResultCard({ product }: { product: Product }) {
  const stale = isStale(product.updated_at);
  const hasPrice = product.price_per_kilo !== null || product.unit_price !== null;

  return (
    <div className="rounded-lg border border-border p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-medium leading-snug md:text-lg">
            {product.brand ? `${product.brand} — ` : ""}
            {product.description}
          </p>
          {product.supplier?.name && (
            <p className="text-xs text-muted-foreground md:text-sm">{product.supplier.name}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          {product.unit_price !== null && (
            <p className="text-lg font-semibold md:text-2xl">{formatCurrency(product.unit_price)}</p>
          )}
          {product.price_per_kilo !== null && (
            <p className="text-sm text-muted-foreground md:text-base">
              {formatCurrency(product.price_per_kilo)} / kg-m-L
            </p>
          )}
          {!hasPrice && (
            <Badge variant="warning" className="md:px-3 md:py-1 md:text-sm">
              Sin precio
            </Badge>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        {stale && hasPrice && (
          <Badge variant="warning" className="md:px-3 md:py-1 md:text-sm">
            Puede estar desactualizado
          </Badge>
        )}
        {!stale && hasPrice && (
          <Badge variant="success" className="md:px-3 md:py-1 md:text-sm">
            Actualizado
          </Badge>
        )}
      </div>
    </div>
  );
}
