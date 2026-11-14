"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatPesos } from "@/features/finanzas/money";
import { formatDayLong } from "@/features/finanzas/dates";
import type { DayResult } from "@/features/finanzas/types";

// Abajo -> arriba en cada barra. Colores fijos por forma de pago (no por
// posicion), validados para daltonismo; el de tarjetas tiene poco contraste
// contra el blanco, por eso la leyenda y la tabla "Por dia" de la pagina.
const SERIES = [
  { key: "cash", label: "Efectivo", color: "#2a78d6" },
  { key: "transfers", label: "Transferencias", color: "#eb6834" },
  { key: "cards", label: "Tarjetas", color: "#1baf7a" },
] as const;

const compact = new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 });

/** Tope "redondo" del eje (1, 2, 2.5, 5 x 10^n), mismo criterio que SearchesChart. */
function niceMax(value: number): number {
  if (value <= 0) return 1000;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * magnitude >= value) return step * magnitude;
  }
  return 10 * magnitude;
}

/**
 * Ventas por dia del mes, apiladas por forma de pago, con una linea del
 * promedio diario (solo dias con ventas). Hecho con divs como SearchesChart.
 * Al pasar el mouse o tocar una barra se muestra el detalle del dia.
 */
export function DailySalesChart({ days }: { days: DayResult[] }) {
  const [active, setActive] = useState<number | null>(null);
  const withSales = days.filter((d) => d.sales > 0);
  const average = withSales.length > 0 ? withSales.reduce((acc, d) => acc + d.sales, 0) / withSales.length : 0;
  const max = niceMax(Math.max(0, ...days.map((d) => d.sales)));
  const ticks = [max, max / 2, 0];
  const shown = active !== null ? days[active] : null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {SERIES.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
          {average > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 border-t-2 border-dashed border-foreground/60" />
              Promedio {formatPesos(average)}
            </span>
          )}
        </div>
      </div>

      <p className="mb-2 min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {shown ? (
          <>
            <span className="font-medium text-foreground">{formatDayLong(shown.date)}</span> ·{" "}
            <span className="font-medium tabular-nums text-foreground">{formatPesos(shown.sales)}</span>
            {shown.sales > 0 && (
              <span className="tabular-nums">
                {" "}
                ({SERIES.filter((s) => shown[s.key] > 0)
                  .map((s) => `${s.label.toLowerCase()} ${formatPesos(shown[s.key])}`)
                  .join(" · ")})
              </span>
            )}
          </>
        ) : (
          "Pasá el mouse o tocá una barra para ver el detalle del día."
        )}
      </p>

      <div className="flex gap-2" aria-hidden="true">
        <div className="flex h-48 flex-col justify-between text-right text-[11px] tabular-nums text-muted-foreground">
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 leading-none last:translate-y-0">
              ${compact.format(t)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-48">
            {ticks.map((t) => (
              <div
                key={t}
                className={cn("absolute inset-x-0 border-t", t === 0 ? "border-border" : "border-dashed border-border/70")}
                style={{ bottom: `${(t / max) * 100}%` }}
              />
            ))}
            <div className="absolute inset-0 flex items-end gap-0.5" onMouseLeave={() => setActive(null)}>
              {days.map((d, i) => {
                const segments = SERIES.filter((s) => d[s.key] > 0);
                return (
                  <button
                    key={d.date}
                    type="button"
                    tabIndex={-1}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => setActive(i)}
                    className="flex h-full flex-1 items-end justify-center"
                  >
                    <span
                      className={cn(
                        "flex w-full max-w-6 flex-col-reverse gap-[2px] transition-opacity",
                        active !== null && active !== i && "opacity-40"
                      )}
                      style={{ height: `${(d.sales / max) * 100}%` }}
                    >
                      {segments.map((s, j) => (
                        <span
                          key={s.key}
                          className={cn("min-h-[2px] w-full", j === segments.length - 1 && "rounded-t")}
                          style={{ flexGrow: d[s.key], flexBasis: 0, backgroundColor: s.color }}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
            {average > 0 && (
              <div
                className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-foreground/60"
                style={{ bottom: `${(average / max) * 100}%` }}
              />
            )}
          </div>

          <div className="mt-1.5 flex gap-0.5 text-[11px] tabular-nums text-muted-foreground">
            {days.map((d, i) => (
              <span
                key={d.date}
                className={cn(
                  "flex-1 text-center",
                  // En pantallas angostas, una etiqueta si y una no.
                  i % 2 === 1 && "invisible sm:visible",
                  active === i && "visible font-semibold text-foreground"
                )}
              >
                {Number(d.date.slice(8))}
              </span>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>Ventas por día</caption>
        <thead>
          <tr>
            <th>Día</th>
            {SERIES.map((s) => (
              <th key={s.key}>{s.label}</th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <td>{formatDayLong(d.date)}</td>
              {SERIES.map((s) => (
                <td key={s.key}>{formatPesos(d[s.key])}</td>
              ))}
              <td>{formatPesos(d.sales)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
