"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Pencil, MoreHorizontal } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { lookupBrandColor, type BrandColor } from "@/lib/brand-colors";
import { Badge } from "@/components/ui/badge";
import { WhatsAppShareButton } from "@/features/products/components/whatsapp-share-button";
import { AddToCartButton } from "@/features/cart/components/add-to-cart-button";
import type { Product } from "@/lib/supabase/types";

function isStale(updatedAt: string): boolean {
  const days = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  return days > 60;
}

/**
 * Fila de resultado (listado, no tiles): pensada para consultar un precio lo
 * mas rapido posible -- una linea por producto, precio siempre a la vista a
 * la derecha, sin tags ni badges que no aporten a esa tarea. Se usa dentro
 * de un contenedor con divide-y (ver ProductSearchResults), no tiene borde
 * propio.
 *
 * Editar y Reportar sin stock son ocasionales -- quedan atras del boton
 * "...". Compartir (icono) y Agregar (modulo compras) quedan siempre
 * visibles porque son las acciones que de verdad se usan seguido.
 */
export function ProductResultCard({
  product,
  basePath = "/search",
  isOwner = false,
  brandColorMap,
}: {
  product: Product;
  /** Raiz de rutas para "reportar sin stock" -- este mismo componente se usa
   * tanto en /search (empleado) como en /products (dueño), cada uno con sus
   * propias sub-rutas. */
  basePath?: string;
  /** Solo /products lo pasa en true. Controla el link de edicion (lapiz) y
   * el boton de compartir por WhatsApp, que un empleado no deberia ver. */
  isOwner?: boolean;
  /** marca (normalizada) -> color persistido en brand_colors (ver
   * features/brands/queries.ts), armado una sola vez por ProductSearchResults.
   * Colores dinamicos por org -> se aplican como estilo inline, no como
   * clases Tailwind (el JIT no puede conocerlos en build time). */
  brandColorMap: Record<string, BrandColor>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const stale = isStale(product.updated_at);
  const hasPrice = product.price_per_kilo !== null || product.unit_price !== null;
  const hasImage = Boolean(product.image_url);

  const thumbnail = hasImage && (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      aria-label={expanded ? "Ocultar foto" : "Ver foto"}
      className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted/30 md:h-12 md:w-12"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.image_url ?? ""} alt={product.description} className="h-full w-full object-cover" />
    </button>
  );

  const priceChip = (
    <div className="shrink-0 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-right">
      {product.unit_price !== null && (
        <p className="text-base font-bold leading-tight text-primary md:text-lg">
          {formatCurrency(product.unit_price)}
        </p>
      )}
      {product.price_per_kilo !== null && (
        <p className="text-xs font-medium leading-tight text-primary/80">
          {formatCurrency(product.price_per_kilo)} / kg
        </p>
      )}
      {!hasPrice && (
        <Badge variant="warning" className="text-xs">
          Sin precio
        </Badge>
      )}
      {stale && hasPrice && <p className="mt-0.5 text-[10px] font-medium text-amber-600">Desactualizado</p>}
    </div>
  );

  return (
    <div className="transition-colors hover:bg-muted/50">
      {/*
        En mobile la fila se parte en dos renglones (flex-col) -- todo en una
        sola linea (thumbnail + marca + descripcion + precio + acciones)
        quedaba demasiado apretado en pantallas angostas: la descripcion se
        truncaba casi de entrada y el precio/acciones se comian el resto.
        Desde md en adelante vuelve a ser una sola fila igual que antes
        (md:contents hace que el segundo renglon "desaparezca" como caja y
        sus hijos pasen a ser items directos de la fila).
      */}
      <div className="flex flex-col gap-2 px-3 py-2.5 md:flex-row md:items-center md:gap-3 md:px-4 md:py-3">
        <div className="flex min-w-0 items-center gap-3 md:flex-1">
          {!hasImage && (
            <div className="h-11 w-11 shrink-0 md:h-12 md:w-12" />
          )}
          {thumbnail}

          <div className="flex min-w-0 flex-1 items-center gap-3">
            {product.brand ? (
              <span
                className="w-20 shrink-0 truncate rounded-full px-2 py-0.5 text-center text-xs font-semibold md:w-32 md:text-sm"
                style={{
                  backgroundColor: lookupBrandColor(brandColorMap, product.brand).background,
                  color: lookupBrandColor(brandColorMap, product.brand).foreground,
                }}
              >
                {product.brand}
              </span>
            ) : (
              <span className="w-20 shrink-0 text-center text-xs text-muted-foreground md:w-32 md:text-sm">—</span>
            )}
            <span className="min-w-0 flex-1 truncate font-medium leading-snug text-foreground text-sm md:text-base">
              {product.description}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 md:contents">
          {priceChip}

          <div className="flex shrink-0 items-center gap-1">
            {isOwner && <WhatsAppShareButton product={product} />}
            <AddToCartButton product={product} />
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              aria-label="Más acciones"
              aria-expanded={showMore}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground",
                showMore && "bg-muted text-foreground"
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {expanded && hasImage && (
        <div className="px-3 pb-3 md:px-4">
          <div className="aspect-[4/3] w-full max-w-xs overflow-hidden rounded-md bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image_url ?? ""}
              alt={product.description}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      {showMore && (
        <div className="flex flex-wrap items-center gap-4 border-t border-dashed border-border px-3 py-2 text-xs md:px-4 md:text-sm">
          {isOwner && (
            <Link
              href={`/products/${product.id}`}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Link>
          )}
          <Link
            href={`${basePath}/report?productId=${product.id}`}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Reportar sin stock
          </Link>
        </div>
      )}
    </div>
  );
}
