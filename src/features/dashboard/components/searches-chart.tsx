"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { DailySearchTotal } from "@/features/dashboard/queries";

const weekdayFormat = new Intl.DateTimeFormat("es-AR", { weekday: "short", timeZone: "UTC" });

function parseDay(day: string): Date {
  // Mediodia UTC para que el dia de la semana no se corra por zona horaria.
  return new Date(`${day}T12:00:00Z`);
}

function dayLabel(day: string): string {
  const [, month, date] = day.split("-");
  return `${weekdayFormat.format(parseDay(day))} ${Number(date)}/${Number(month)}`;
}

/** Tope "redondo" del eje (1, 2, 5 x 10^n) para que las lineas guia caigan en
 * numeros faciles de leer. */
function niceMax(value: number): number {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * magnitude >= value) return step * magnitude;
  }
  return 10 * magnitude;
}

/**
 * Barras de busquedas por dia (una sola serie -> sin leyenda, el titulo la
 * nombra). Hecho con divs en vez de una libreria de graficos: son 14 barras
 * y no vale la pena sumar una dependencia. Al pasar el mouse o tocar una
 * barra se muestra el dia y el total; la tabla sr-only es la vista accesible.
 */
export function SearchesChart({ data }: { data: DailySearchTotal[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.count)));
  const ticks = [max, max / 2, 0];
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const today = data[data.length - 1];
  const shown = active !== null ? data[active] : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-3xl font-semibold tabular-nums">{total.toLocaleString("es-AR")}</p>
          <p className="text-sm text-muted-foreground">búsquedas en los últimos {data.length} días</p>
        </div>
        <p className="h-5 text-sm text-muted-foreground" aria-live="polite">
          {shown ? (
            <>
              <span className="font-medium capitalize text-foreground">{dayLabel(shown.day)}</span> ·{" "}
              {shown.count.toLocaleString("es-AR")} {shown.count === 1 ? "búsqueda" : "búsquedas"}
            </>
          ) : (
            today && (
              <>
                Hoy: <span className="font-medium text-foreground">{today.count.toLocaleString("es-AR")}</span>
              </>
            )
          )}
        </p>
      </div>

      <div className="flex gap-2" aria-hidden="true">
        <div className="flex h-40 flex-col justify-between text-right text-[11px] tabular-nums text-muted-foreground">
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 leading-none last:translate-y-0">
              {t.toLocaleString("es-AR")}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-40">
            {ticks.map((t) => (
              <div
                key={t}
                className={cn("absolute inset-x-0 border-t", t === 0 ? "border-border" : "border-dashed border-border/70")}
                style={{ bottom: `${(t / max) * 100}%` }}
              />
            ))}
            <div className="absolute inset-0 flex items-end gap-0.5" onMouseLeave={() => setActive(null)}>
              {data.map((d, i) => (
                <button
                  key={d.day}
                  type="button"
                  tabIndex={-1}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className="group flex h-full flex-1 items-end justify-center"
                >
                  <span
                    className={cn(
                      "w-full max-w-7 rounded-t bg-primary transition-opacity",
                      active !== null && active !== i && "opacity-40"
                    )}
                    style={{ height: d.count > 0 ? `max(${(d.count / max) * 100}%, 2px)` : 0 }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-1.5 flex gap-0.5 text-[11px] tabular-nums text-muted-foreground">
            {data.map((d, i) => (
              <span
                key={d.day}
                className={cn(
                  "flex-1 text-center",
                  // En pantallas angostas, una etiqueta si y una no.
                  (data.length - 1 - i) % 2 === 1 && "invisible sm:visible",
                  active === i && "font-semibold text-foreground"
                )}
              >
                {Number(d.day.slice(8))}
              </span>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>Búsquedas por día</caption>
        <thead>
          <tr>
            <th>Día</th>
            <th>Búsquedas</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{dayLabel(d.day)}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
