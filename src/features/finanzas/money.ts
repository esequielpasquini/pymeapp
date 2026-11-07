/**
 * Pesos sin decimales ("$ 13.000"): en el cuaderno y en los resultados del
 * modulo finanzas los montos son siempre enteros, y los ",00" de
 * formatCurrency solo agregan ruido en tablas largas.
 */
export function formatPesos(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Parsea un monto tipeado a la manera argentina: "13.000", "13000",
 * "$ 13.000", "1.250,50". El punto es separador de miles y la coma de
 * decimales. Devuelve null si no es un numero positivo.
 */
export function parsePesos(input: string): number | null {
  const cleaned = input.replace(/[$\s]/g, "").replace(/\./g, "").replace(",", ".");
  if (cleaned === "" || !/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return value > 0 ? value : null;
}
