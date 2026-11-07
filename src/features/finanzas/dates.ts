/**
 * Helpers de fechas del modulo finanzas. Todas las fechas de negocio son
 * "date" de Postgres (YYYY-MM-DD, sin hora ni zona) y se manejan como
 * string para no caer en corrimientos de un dia por zona horaria al pasar
 * por Date. "Hoy" se calcula en la hora de Argentina, no la del servidor
 * (Vercel corre en UTC: a las 22 hs de Argentina ya es "mañana" en UTC).
 */

const AR_TIMEZONE = "America/Argentina/Buenos_Aires";

/** Fecha de hoy en Argentina como YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  // en-CA formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: AR_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** true si year/month/day forman una fecha real (descarta 31/11, 29/02 no bisiesto, etc.). */
export function isValidDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/**
 * Fecha de una hoja del cuaderno a partir del dia y mes leidos. El año
 * escrito a mano no es confiable (en las muestras aparece "03/11/24" en
 * noviembre de 2026, o directamente no esta), asi que se ignora: se toma la
 * ocurrencia mas reciente de ese dia/mes que no sea futura. Las hojas
 * siempre se suben despues de escritas, asi que eso es casi siempre lo
 * correcto -- y el dueño igual confirma la fecha antes de guardar.
 */
export function resolveSheetDate(
  day: number | null | undefined,
  month: number | null | undefined,
  today: string = todayIso()
): string | null {
  if (!day || !month) return null;
  const [todayYear] = today.split("-").map(Number);
  for (const year of [todayYear, todayYear - 1]) {
    if (!isValidDate(year, month, day)) continue;
    const iso = toIso(year, month, day);
    if (iso <= today) return iso;
  }
  return null;
}

/** "2026-11" del mes de una fecha YYYY-MM-DD. */
export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

/** Valida un parametro ?mes=YYYY-MM; si no es valido devuelve el mes actual. */
export function parseMonthParam(value: string | string[] | undefined, today: string = todayIso()): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw)) return raw;
  return monthOf(today);
}

/** Primer y ultimo dia (inclusive) de un mes "YYYY-MM". */
export function monthRange(month: string): { from: string; to: string } {
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return { from: toIso(year, m, 1), to: toIso(year, m, lastDay) };
}

/** Mes anterior/siguiente de "YYYY-MM". */
export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(year, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

/** Todos los dias YYYY-MM-DD de un rango, inclusive. */
export function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];
  const [y, m, d] = from.split("-").map(Number);
  const cursor = new Date(Date.UTC(y, m - 1, d));
  while (true) {
    const iso = toIso(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate());
    if (iso > to) break;
    days.push(iso);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** "Lunes 02/11/2026" */
export function formatDayLong(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${WEEKDAYS[weekdayOf(iso)]} ${d}/${m}/${y}`;
}

/** "02/11" */
export function formatDayShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** "noviembre 2026" */
export function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}
