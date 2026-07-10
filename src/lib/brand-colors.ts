/**
 * Paleta fija de clases Tailwind (borde + fondo + texto) para pintar cada
 * marca con un color distinto en el listado de productos -- puramente
 * visual, no se persiste en la base. El color se deriva de un hash del
 * nombre de la marca, asi que la misma marca siempre cae en el mismo color
 * (no es aleatorio en cada render) sin necesitar una columna nueva ni
 * mantener un mapeo a mano por cada marca que se cargue.
 *
 * Se probo tambien asignar el color por posicion en la lista ordenada de
 * marcas (cero colisiones mientras entren en la paleta), pero se descarto:
 * el negocio suma marcas nuevas seguido y ese enfoque corre el color de
 * marcas ya cargadas cada vez que una marca nueva ordena alfabeticamente
 * antes -- con el hash el color de una marca no se mueve nunca, a costa de
 * poder coincidir con el de otra marca (menos probable cuantos mas colores
 * tenga la paleta).
 *
 * Las clases estan escritas completas (no armadas por interpolacion) para
 * que Tailwind las detecte al escanear el contenido -- si se arman con
 * template strings tipo `border-${color}-300` el JIT no las encuentra.
 */
const BRAND_COLOR_PALETTE = [
  "border-red-300 bg-red-50 text-red-700",
  "border-orange-300 bg-orange-50 text-orange-700",
  "border-amber-300 bg-amber-50 text-amber-700",
  "border-yellow-300 bg-yellow-50 text-yellow-700",
  "border-lime-300 bg-lime-50 text-lime-700",
  "border-green-300 bg-green-50 text-green-700",
  "border-emerald-300 bg-emerald-50 text-emerald-700",
  "border-teal-300 bg-teal-50 text-teal-700",
  "border-cyan-300 bg-cyan-50 text-cyan-700",
  "border-sky-300 bg-sky-50 text-sky-700",
  "border-blue-300 bg-blue-50 text-blue-700",
  "border-indigo-300 bg-indigo-50 text-indigo-700",
  "border-violet-300 bg-violet-50 text-violet-700",
  "border-purple-300 bg-purple-50 text-purple-700",
  "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700",
  "border-pink-300 bg-pink-50 text-pink-700",
  "border-rose-300 bg-rose-50 text-rose-700",
];

export function getBrandColorClasses(brand: string): string {
  let hash = 0;
  for (let i = 0; i < brand.length; i++) {
    hash = (hash * 31 + brand.charCodeAt(i)) >>> 0;
  }
  return BRAND_COLOR_PALETTE[hash % BRAND_COLOR_PALETTE.length];
}
