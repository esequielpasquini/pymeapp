import type { RoundingMode } from "@/lib/supabase/types";

// Misma logica que la funcion SQL round_to_multiple (supabase/migrations/0002_functions.sql).
// Se duplica intencionalmente en TypeScript para poder mostrar la vista previa sin
// pegarle a la base de datos; la aplicacion real siempre corre en el servidor de
// Postgres para evitar drift entre "lo que se previsualizo" y "lo que se aplico".
export function roundToMultiple(value: number | null, rounding: RoundingMode): number | null {
  if (value === null) return null;

  const steps: Record<RoundingMode, number | null> = {
    none: null,
    nearest_1: 1,
    nearest_5: 5,
    nearest_10: 10,
    nearest_50: 50,
    nearest_100: 100,
  };
  const step = steps[rounding];

  if (step === null) {
    return Math.round(value * 100) / 100;
  }
  return Math.round(value / step) * step;
}

export function applyPercent(value: number | null, percent: number, rounding: RoundingMode): number | null {
  if (value === null) return null;
  return roundToMultiple(value * (1 + percent / 100), rounding);
}

export const ROUNDING_OPTIONS: { value: RoundingMode; label: string }[] = [
  { value: "none", label: "Sin redondeo" },
  { value: "nearest_1", label: "Entero mas cercano" },
  { value: "nearest_5", label: "Multiplos de 5" },
  { value: "nearest_10", label: "Multiplos de 10" },
  { value: "nearest_50", label: "Multiplos de 50" },
  { value: "nearest_100", label: "Multiplos de 100" },
];
