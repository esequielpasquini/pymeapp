"use client";

import { useState } from "react";
import { ImageIcon, ChevronDown } from "lucide-react";
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
 * desactualizado (más de 60 días sin tocar). Si el producto tiene imagen, la
 * tarjeta se puede clickear para expandirla y verla -- el contenedor de la
 * imagen tiene un aspect-ratio fijo (con object-cover) para que todas las
 * tarjetas midan lo mismo sin importar el tamaño real de cada foto.
 */
export function ProductResultCard({ product }: { product: Product }) {
  const [expanded, setExpanded] = useState(false);
  const stale = isStale(product.updated_at);
  const hasPrice = product.price_per_kilo !== null || product.unit_price !== null;
  const hasImage = Boolean(product.image_url);

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 break-words font-medium leading-snug md:text-lg">
          {hasImage && <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />}
          {product.brand ? `${product.brand} — ` : ""}
          {product.description}
        </p>
        {product.supplier?.name && (
          <p className="text-xs text-muted-foreground md:text-sm">{product.supplier.name}</p>
        )}
      </div>
      <div className="flex shrink-0 items-start gap-2">
        <div className="text-right">
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
        {hasImage && (
          <ChevronDown
            className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}
      </div>
    </div>
  );

  const badges = (
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
  );

  if (!hasImage) {
    return (
      <div className="rounded-lg border border-border p-4 md:p-5">
        {header}
        {badges}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-4 md:p-5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
        aria-expanded={expanded}
      >
        {header}
      </button>
      {badges}
      {expanded && (
        <div className="mt-3 aspect-[4/3] w-full overflow-hidden rounded-md bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url ?? ""}
            alt={product.description}
            className="h-full w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
