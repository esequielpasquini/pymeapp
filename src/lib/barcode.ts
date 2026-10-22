/**
 * Codigo de barras normalizado (sin espacios) o null si viene vacio. Solo
 * letras, numeros y guion: cubre EAN/UPC y codigos internos, y ademas es
 * seguro para meterlo en un filtro or() de PostgREST sin escapar (ver
 * searchProducts). Lo usan el formulario, el import de Excel y el buscador.
 */
export function normalizeBarcode(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  // Excel puede guardar el codigo como numero: 7790001234567 -> "7790001234567".
  const raw = typeof value === "number" ? value.toFixed(0) : String(value);
  const code = raw.replace(/\s+/g, "");
  return code.length > 0 ? code : null;
}

export function isValidBarcode(code: string): boolean {
  return /^[0-9A-Za-z-]{1,64}$/.test(code);
}
