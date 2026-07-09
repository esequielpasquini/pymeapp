"use client";

import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/supabase/types";

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.004 2.003c-5.514 0-9.997 4.483-9.997 9.997 0 1.762.464 3.484 1.345 4.997l-1.43 5.23 5.36-1.406a9.96 9.96 0 0 0 4.722 1.176h.004c5.514 0 9.997-4.483 9.997-9.997 0-2.67-1.04-5.18-2.929-7.07a9.936 9.936 0 0 0-7.072-2.927zm0 18.19h-.003a8.19 8.19 0 0 1-4.175-1.145l-.299-.178-3.181.834.849-3.1-.195-.318a8.198 8.198 0 0 1-1.257-4.386c0-4.532 3.688-8.221 8.223-8.221a8.166 8.166 0 0 1 5.813 2.408 8.165 8.165 0 0 1 2.406 5.815c0 4.535-3.689 8.223-8.221 8.223z" />
    </svg>
  );
}

/** Marca + descripcion + precio(s), tal como lo pidio el dueño: el mensaje
 * que arma este boton es literalmente lo que un empleado le contesta a un
 * cliente que pregunta un precio por WhatsApp. Si el producto tiene los
 * dos precios cargados (unitario y por kilo) se incluyen ambos -- no son
 * excluyentes, un producto puede venderse por unidad y por kilo a la vez.
 * Si no tiene ninguno, avisa que hay que consultarlo. */
function buildShareMessage(product: Product): string {
  const title = product.brand ? `${product.brand} - ${product.description}` : product.description;

  const priceLines: string[] = [];
  if (product.unit_price !== null) {
    priceLines.push(`Precio por bolsa: ${formatCurrency(product.unit_price)}`);
  }
  if (product.price_per_kilo !== null) {
    priceLines.push(`Precio por kg: ${formatCurrency(product.price_per_kilo)}`);
  }
  if (priceLines.length === 0) {
    priceLines.push("Precio: a confirmar");
  }

  return `${title}\n${priceLines.join("\n")}`;
}

export function WhatsAppShareButton({ product }: { product: Product }) {
  function handleShare() {
    const message = buildShareMessage(product);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Compartir por WhatsApp"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-green-700 hover:bg-green-50 hover:text-green-800"
    >
      <WhatsAppIcon className="h-4 w-4" />
    </button>
  );
}
