"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Pencil, MoreHorizontal } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
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
}: {
  product: Product;
  /** Raiz de rutas para "reportar sin stock" -- este mismo componente se usa
   * tanto en /search (empleado) como en /products (dueño), cada uno con sus
   * propias sub-rutas. */
  basePath?: string;
  /** Solo /products lo pasa en true. Controla el link de edicion (lapiz) y
   * el boton de compartir por WhatsApp, que un empleado no deberia ver. */
  isOwner?: boolean;
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
      <div className="flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3">
        {!hasImage && (
          <div className="h-11 w-11 shrink-0 md:h-12 md:w-12" />
        )}
        {thumbnail}

        <div className="flex min-w-0 flex-1 items-baseline gap-3">
          <span className="w-24 shrink-0 truncate text-sm font-semibold text-muted-foreground md:w-36 md:text-base">
            {product.brand || "—"}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium leading-snug md:text-lg">
            {product.description}
          </span>
        </div>

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
