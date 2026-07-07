import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { ProductResultCard } from "@/features/products/components/product-result-card";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/supabase/types";

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
}: {
  products: Product[];
  q: string;
  basePath: string;
  isOwner?: boolean;
}) {
  return (
    <>
      {products.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center md:p-8">
          <p className="mb-3 text-sm text-muted-foreground md:text-base">
            No encontramos &quot;{q}&quot;. Faltaba en el sistema?
          </p>
          <Button asChild size="lg" className="md:h-12 md:px-6 md:text-base">
            <Link href={`${basePath}/report?name=${encodeURIComponent(q)}`}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Reportar faltante
            </Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {products.map((product) => (
          <ProductResultCard key={product.id} product={product} basePath={basePath} isOwner={isOwner} />
        ))}
      </div>
    </>
  );
}
