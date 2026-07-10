/**
 * Color por marca, ahora persistido en la tabla brand_colors (ver
 * 0020_brand_colors.sql) en vez de derivado en el cliente -- se probaron
 * antes un hash del nombre y un color por posicion en la lista ordenada,
 * pero ninguno servia: el hash podia hacer que dos marcas compartieran
 * color, y el color por posicion se corria cada vez que se sumaba una marca
 * nueva. Persistir "a esta marca ya le toco tal color" resuelve los dos
 * problemas a la vez.
 *
 * Este archivo solo tiene las funciones puras (generar un color nuevo,
 * decidir si el texto va blanco o negro, buscar en el mapa ya cargado) --
 * la lectura/escritura a la base vive en features/brands/.
 */

export type BrandColor = { background: string; foreground: "#ffffff" | "#000000" };

const FALLBACK_COLOR: BrandColor = { background: "#e5e7eb", foreground: "#000000" };

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Color de fondo random para una marca nueva, evitando repetir el hex
 * exacto de cualquier color ya usado por otra marca de la misma
 * organizacion. Saturacion/luminosidad acotadas (55-79% / 42-63%) para que
 * el color no salga ni casi blanco ni casi negro -- en esos extremos
 * cuesta mas leer el texto encima aunque el contraste se elija bien.
 */
export function randomBrandColor(usedColors: Iterable<string>): string {
  const used = new Set(Array.from(usedColors, (c) => c.toLowerCase()));

  for (let attempt = 0; attempt < 50; attempt++) {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 55 + Math.floor(Math.random() * 25);
    const lightness = 42 + Math.floor(Math.random() * 22);
    const hex = hslToHex(hue, saturation, lightness);
    if (!used.has(hex.toLowerCase())) return hex;
  }

  // 50 intentos random distintos ya colisionaron con algo usado -- a esta
  // altura hay tantas marcas que no vale la pena seguir insistiendo.
  return hslToHex(Math.floor(Math.random() * 360), 65, 50);
}

/**
 * Blanco o negro segun cual da mas contraste contra `bgHex` (formula YIQ de
 * brillo percibido) -- asi el texto de la marca siempre se lee, sea cual
 * sea el color random que le haya tocado.
 */
export function getContrastTextColor(bgHex: string): "#ffffff" | "#000000" {
  const match = /^#([0-9a-f]{6})$/i.exec(bgHex);
  if (!match) return "#000000";

  const int = parseInt(match[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

export function lookupBrandColor(map: Record<string, BrandColor>, brand: string): BrandColor {
  return map[brand.trim().toLowerCase()] ?? FALLBACK_COLOR;
}
