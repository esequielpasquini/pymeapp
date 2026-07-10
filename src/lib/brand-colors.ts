/**
 * Paleta fija de clases Tailwind (borde + fondo + texto) para pintar cada
 * marca con un color distinto en el listado de productos -- puramente
 * visual, no se persiste en la base. El color se deriva de un hash del
 * nombre de la marca, asi que la misma marca siempre cae en el mismo color
 * (no es aleatorio en cada render) sin necesitar una columna nueva ni
 * mantener un mapeo a mano por cada marca que se cargue.
 *
 * Las clases estan escritas completas (no armadas por interpolacion) para
 * que Tailwind las detecte al escanear el contenido -- si se arman con
 * template strings tipo `border-${color}-300` el JIT no las encuentra.
 */
const BRAND_COLOR_PALETTE = [
  "border-rose-300 bg-rose-50 text-rose-700",
  "border-orange-300 bg-orange-50 text-orange-700",
  "border-amber-300 bg-amber-50 text-amber-700",
  "border-lime-300 bg-lime-50 text-lime-700",
  "border-emerald-300 bg-emerald-50 text-emerald-700",
  "border-teal-300 bg-teal-50 text-teal-700",
  "border-sky-300 bg-sky-50 text-sky-700",
  "border-indigo-300 bg-indigo-50 text-indigo-700",
  "border-violet-300 bg-violet-50 text-violet-700",
  "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700",
];

export function getBrandColorClasses(brand: string): string {
  let hash = 0;
  for (let i = 0; i < brand.length; i++) {
    hash = (hash * 31 + brand.charCodeAt(i)) >>> 0;
  }
  return BRAND_COLOR_PALETTE[hash % BRAND_COLOR_PALETTE.length];
}
