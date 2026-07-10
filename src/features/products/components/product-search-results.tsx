import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { ProductResultCard } from "@/features/products/components/product-result-card";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/supabase/types";
import type { BrandColor } from "@/lib/brand-colors";

/**
 * Grilla de resultados de una busqueda de texto + estado vacio ("no
 * encontramos X, reportar faltante"). Extraido de SearchHomeView para
 * reusarlo en cualquier pantalla que tenga un SearchBox -- en particular las
 * vistas de "elegir marca/proveedor/tag" (BrandsBrowseView, etc), donde
 * antes el buscador de arriba no hacia nada: mostraba el input pero la
 * pantalla ignoraba `q` y seguia listando siempre lo mismo.
 */
export function ProductSearchResults({
  products,
  q,
  basePath,
  isOwner = false,
  brandColorMap,
}: {
  products: Product[];
  /** Puede no haber texto de busqueda si lo que trajo estos resultados fue
   * solo una combinacion de filtros (categoria/marca/proveedor/tag) -- el
   * estado vacio cambia de mensaje segun haya o no un termino tipeado. */
  q?: string;
  basePath: string;
  isOwner?: boolean;
  /** Ver ProductResultCard -- mapa marca->color persistido, armado una sola
   * vez con features/brands/queries.ts#getBrandColorMap. */
  brandColorMap: Record<string, BrandColor>;
}) {
  return (
    <>
      {products.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center md:p-8">
          <p className="mb-3 text-sm text-muted-foreground md:text-base">
            {q ? (
              <>No encontramos &quot;{q}&quot;. Faltaba en el sistema?</>
            ) : (
              "No hay productos que coincidan con los filtros aplicados."
            )}
          </p>
          <Button asChild size="lg" className="md:h-12 md:px-6 md:text-base">
            <Link href={q ? `${basePath}/report?name=${encodeURIComponent(q)}` : `${basePath}/report`}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Reportar faltante
            </Link>
          </Button>
        </div>
      )}

      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {products.map((product) => (
          <ProductResultCard
            key={product.id}
            product={product}
            basePath={basePath}
            isOwner={isOwner}
            brandColorMap={brandColorMap}
          />
        ))}
      </div>
    </>
  );
}
