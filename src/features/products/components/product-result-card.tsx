"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Pencil, MoreHorizontal } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { lookupBrandColor, type BrandColor } from "@/lib/brand-colors";
import { WhatsAppShareButton } from "@/features/products/components/whatsapp-share-button";
import { AddToCartButton } from "@/features/cart/components/add-to-cart-button";
import type { Product } from "@/lib/supabase/types";

function isStale(updatedAt: string): boolean {
  const days = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  return days > 60;
}

/**
 * Fila de resultado (listado, no tiles): pensada para que el empleado
 * encuentre el producto y lea el precio lo mas rapido posible. Se usa
 * dentro de un contenedor con divide-y (ver ProductSearchResults), no tiene
 * borde propio.
 *
 * Jerarquia: la descripcion es lo que se lee primero (grande, hasta 2
 * lineas, sin truncar de entrada); la marca va arriba como etiqueta chica y
 * se refuerza con una franja de color a la izquierda -- en un listado
 * ordenado por marca las franjas agrupan visualmente sin ocupar ancho (antes
 * era una pastilla de ancho fijo que se comia media fila y cortaba el
 * nombre). El precio va solo, alineado a la derecha, sin caja.
 *
 * Editar y Reportar sin stock son ocasionales -- quedan atras del boton
 * "...". Compartir y Agregar quedan siempre visibles porque son las
 * acciones que de verdad se usan seguido.
 *
 * Layout con grid-template-areas: en mobile las acciones van en un segundo
 * renglon debajo de la descripcion y el precio ocupa los dos renglones a la
 * derecha; desde md todo queda en una sola fila.
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
  const brandColor = product.brand ? lookupBrandColor(brandColorMap, product.brand) : null;

  return (
    <div className="relative transition-colors hover:bg-muted/40">
      {brandColor && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: brandColor.background }}
        />
      )}

      <div
        className={cn(
          "grid items-center gap-x-3 gap-y-1.5 py-3 pl-4 pr-3 md:gap-x-4 md:pl-5 md:pr-4",
          hasImage
            ? "grid-cols-[auto_minmax(0,1fr)_auto] [grid-template-areas:'thumb_info_price''actions_actions_price'] md:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:[grid-template-areas:'thumb_info_price_actions']"
            : "grid-cols-[minmax(0,1fr)_auto] [grid-template-areas:'info_price''actions_price'] md:grid-cols-[minmax(0,1fr)_auto_auto] md:[grid-template-areas:'info_price_actions']"
        )}
      >
        {hasImage && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Ocultar foto" : "Ver foto"}
            className="h-14 w-14 shrink-0 self-start overflow-hidden rounded-lg border border-border bg-muted/30 [grid-area:thumb] md:self-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.image_url ?? ""} alt={product.description} className="h-full w-full object-cover" />
          </button>
        )}

        <div className="min-w-0 [grid-area:info]">
          {product.brand && (
            <p className="truncate text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:text-xs">
              {product.brand}
            </p>
          )}
          <p className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-foreground md:text-base">
            {product.description}
          </p>
        </div>

        <div className="self-start text-right [grid-area:price] md:self-center">
          {product.unit_price !== null && (
            <p className="whitespace-nowrap text-lg font-bold leading-tight tabular-nums text-foreground md:text-xl">
              {formatCurrency(product.unit_price)}
            </p>
          )}
          {product.price_per_kilo !== null && (
            <p
              className={cn(
                "whitespace-nowrap tabular-nums",
                product.unit_price !== null
                  ? "text-xs text-muted-foreground md:text-sm"
                  : "text-lg font-bold leading-tight text-foreground md:text-xl"
              )}
            >
              {formatCurrency(product.price_per_kilo)} / kg
            </p>
          )}
          {!hasPrice && <p className="text-sm font-medium text-amber-700">Sin precio</p>}
          {stale && hasPrice && (
            <p className="mt-0.5 text-[11px] font-medium text-amber-600">Desactualizado</p>
          )}
        </div>

        <div className="flex items-center gap-0.5 [grid-area:actions]">
          <AddToCartButton product={product} />
          {isOwner && <WhatsAppShareButton product={product} />}
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            aria-label="Más acciones"
            aria-expanded={showMore}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground",
              showMore && "bg-muted text-foreground"
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && hasImage && (
        <div className="pb-3 pl-4 pr-3 md:pl-5 md:pr-4">
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
        <div className="flex flex-wrap items-center gap-4 border-t border-dashed border-border py-2 pl-4 pr-3 text-xs md:pl-5 md:pr-4 md:text-sm">
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
