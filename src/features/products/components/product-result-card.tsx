"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageIcon, ChevronDown, AlertCircle, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { WhatsAppShareButton } from "@/features/products/components/whatsapp-share-button";
import type { Product } from "@/lib/supabase/types";

function isStale(updatedAt: string): boolean {
  const days = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  return days > 60;
}

/**
 * Tarjeta de resultado pensada para el buscador del empleado: grande, clara,
 * usable desde el celular en el mostrador. El precio va en un recuadro con
 * fondo propio (bg-primary/10) para que sea lo primero que salta a la vista
 * al mostrarle la pantalla a un cliente en el mostrador. Si el producto
 * tiene imagen, la tarjeta se puede clickear para expandirla -- el
 * contenedor de la imagen tiene un aspect-ratio fijo (con object-cover) para
 * que todas las tarjetas midan lo mismo sin importar el tamaño real de cada
 * foto.
 */
export function ProductResultCard({
  product,
  basePath = "/search",
  isOwner = false,
}: {
  product: Product;
  /** Raiz de rutas para "reportar sin stock" y para los tags clickeables --
   * este mismo componente se usa tanto en /search (empleado) como en
   * /products (dueño), cada uno con sus propias sub-rutas. */
  basePath?: string;
  /** Solo /products lo pasa en true. Controla dos cosas que un empleado no
   * deberia ver: el link de edicion (lapiz) hacia la ficha del producto, y
   * el boton de compartir por WhatsApp. */
  isOwner?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const stale = isStale(product.updated_at);
  const hasPrice = product.price_per_kilo !== null || product.unit_price !== null;
  const hasImage = Boolean(product.image_url);

  const priceBox = (
    <div className="shrink-0 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-right">
      {product.unit_price !== null && (
        <p className="text-lg font-bold text-primary md:text-2xl">{formatCurrency(product.unit_price)}</p>
      )}
      {product.price_per_kilo !== null && (
        <p className="text-sm font-medium text-primary/80 md:text-base">
          {formatCurrency(product.price_per_kilo)} / kg
        </p>
      )}
      {!hasPrice && (
        <Badge variant="warning" className="md:px-3 md:py-1 md:text-sm">
          Sin precio
        </Badge>
      )}
    </div>
  );

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
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
        {priceBox}
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

  const tagPills = product.tags.length > 0 && (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {product.tags.map((tag) => (
        <Link
          key={tag}
          href={`${basePath}?tag=${encodeURIComponent(tag)}`}
          className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground md:text-sm"
        >
          #{tag}
        </Link>
      ))}
    </div>
  );

  const actions = (
    <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
      {isOwner && (
        <Link
          href={`/products/${product.id}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground md:text-sm"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Link>
      )}
      <Link
        href={`${basePath}/report?productId=${product.id}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground md:text-sm"
      >
        <AlertCircle className="h-3.5 w-3.5" />
        Reportar sin stock
      </Link>
      {isOwner && <WhatsAppShareButton product={product} />}
    </div>
  );

  if (!hasImage) {
    return (
      <div className="rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/70 md:p-5">
        {header}
        {badges}
        {tagPills}
        {actions}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/70 md:p-5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
        aria-expanded={expanded}
      >
        {header}
      </button>
      {badges}
      {tagPills}
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
      {actions}
    </div>
  );
}
