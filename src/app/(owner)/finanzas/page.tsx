import Link from "next/link";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { getPeriodResult } from "@/features/finanzas/queries";
import { comparisonRange, groupByWeek, projectMonth } from "@/features/finanzas/results";
import { formatPesos } from "@/features/finanzas/money";
import {
  formatDayShort,
  formatMonth,
  monthOf,
  monthRange,
  parseMonthParam,
  todayIso,
  weekdayOf,
} from "@/features/finanzas/dates";
import { MonthNav } from "@/features/finanzas/components/month-nav";
import { DailySalesChart } from "@/features/finanzas/components/daily-sales-chart";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type Comparison = { previous: number; label: string };

/** "+12,3% vs. octubre". Solo para montos donde subir es bueno (ventas,
 * margen, ganancia). Sin base (mes anterior en 0) no hay porcentaje. */
function Delta({ value, comparison }: { value: number; comparison: Comparison }) {
  const { previous, label } = comparison;
  if (previous === 0) return <p className="text-xs text-muted-foreground">Sin datos {label}</p>;
  const pct = ((value - previous) / Math.abs(previous)) * 100;
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className={cn("h-3.5 w-3.5", up ? "text-green-700" : "text-destructive")} />
      <span className={cn("font-medium tabular-nums", up ? "text-green-700" : "text-destructive")}>
        {up ? "+" : "−"}
        {Math.abs(pct).toFixed(1).replace(".", ",")}%
      </span>
      <span>
        {label} ({formatPesos(previous)})
      </span>
    </p>
  );
}

function Kpi({
  label,
  value,
  detail,
  tone,
  comparison,
}: {
  label: string;
  value: number;
  detail?: string;
  tone?: "positive-negative";
  comparison?: Comparison | null;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 pt-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            "text-2xl font-semibold tabular-nums",
            tone === "positive-negative" && (value < 0 ? "text-destructive" : "text-green-700")
          )}
        >
          {formatPesos(value)}
        </p>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        {comparison && <Delta value={value} comparison={comparison} />}
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card>
      <CardContent className="space-y-1 pt-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function Money({ value, muted }: { value: number; muted?: boolean }) {
  if (value === 0) return <span className="text-muted-foreground">—</span>;
  return <span className={cn("tabular-nums", muted && "text-muted-foreground")}>{formatPesos(value)}</span>;
}

export default async function FinanzasResultsPage({
  searchParams,
}: {
  searchParams: { mes?: string | string[] };
}) {
  const month = parseMonthParam(searchParams.mes);
  const { from, to } = monthRange(month);
  const today = todayIso();
  const compareRange = comparisonRange(month, today);
  const [result, previous] = await Promise.all([
    getPeriodResult(from, to),
    compareRange ? getPeriodResult(compareRange.from, compareRange.to) : Promise.resolve(null),
  ]);
  const weeks = groupByWeek(result.days);
  const projection = projectMonth(result, today);
  const previousMonthName = formatMonth(monthOf(compareRange?.from ?? from)).split(" ")[0];
  const compareLabel = compareRange?.partial
    ? `vs. mismos días de ${previousMonthName}`
    : `vs. ${previousMonthName}`;
  const compareWith = (pick: (r: NonNullable<typeof previous>) => number): Comparison | null =>
    previous ? { previous: pick(previous), label: compareLabel } : null;

  const sheetSales = result.cash + result.transfers;
  const daysWithSales = result.days.filter((d) => d.sales > 0).length;
  const activeDays = result.days.filter((d) => d.sales || d.purchases || d.expenses || d.hasSheet);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Resultados del mes</h2>
        <MonthNav basePath="/finanzas" month={month} />
      </div>

      {(result.missingDays.length > 0 || result.draftCount > 0) && (
        <div className="space-y-1 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          {result.draftCount > 0 && (
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Tenés {result.draftCount === 1 ? "1 hoja" : `${result.draftCount} hojas`} del cuaderno sin confirmar
                (no cuentan todavía).{" "}
                <Link href="/finanzas/planillas" className="font-medium underline underline-offset-4">
                  Revisarlas
                </Link>
              </span>
            </p>
          )}
          {result.missingDays.length > 0 && (
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Días sin hoja del cuaderno: {result.missingDays.map(formatDayShort).join(", ")}.
              </span>
            </p>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi
          label="Ventas"
          value={result.sales}
          detail={`Efectivo ${formatPesos(result.cash)} · Transf. ${formatPesos(result.transfers)} · Tarjetas ${formatPesos(result.cards)}`}
          comparison={compareWith((r) => r.sales)}
        />
        <Kpi label="Facturas de proveedores" value={result.purchases} detail="Total con IVA" />
        <Kpi
          label="Margen bruto"
          value={result.grossMargin}
          detail="Ventas − facturas"
          tone="positive-negative"
          comparison={compareWith((r) => r.grossMargin)}
        />
        <Kpi
          label="Otros gastos"
          value={result.expenses}
          detail={
            result.expensesByCategory.length > 0
              ? result.expensesByCategory
                  .slice(0, 3)
                  .map((c) => `${c.category} ${formatPesos(c.amount)}`)
                  .join(" · ")
              : undefined
          }
        />
        <Kpi
          label="Ganancia neta estimada"
          value={result.netProfit}
          detail="Margen bruto − otros gastos"
          tone="positive-negative"
          comparison={compareWith((r) => r.netProfit)}
        />
        <Card>
          <CardContent className="space-y-1 pt-5">
            <p className="text-sm text-muted-foreground">Ganancia sobre ventas</p>
            <p className="text-2xl font-semibold tabular-nums">
              {result.sales > 0
                ? `${((result.netProfit / result.sales) * 100).toFixed(1).replace(".", ",")}%`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {result.sales > 0 ? "De cada $100 vendidos, lo que queda de ganancia" : "Sin ventas cargadas"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Ventas en el cuaderno"
          value={result.sheetSalesCount.toLocaleString("es-AR")}
          detail={
            daysWithSales > 0
              ? `${Math.round(result.sheetSalesCount / daysWithSales).toLocaleString("es-AR")} por día en promedio`
              : "Sin ventas cargadas"
          }
        />
        <StatCard
          label="Ticket promedio"
          value={result.sheetSalesCount > 0 ? formatPesos(sheetSales / result.sheetSalesCount) : "—"}
          detail="Efectivo y transferencias (las tarjetas se cargan por día)"
        />
        {projection ? (
          <StatCard
            label="Cierre estimado del mes"
            value={formatPesos(projection.projected)}
            detail={`Si seguís a ${formatPesos(projection.dailyAverage)} por día (promedio de ${projection.basedOnDays} días)`}
          />
        ) : (
          <StatCard
            label="Promedio por día trabajado"
            value={daysWithSales > 0 ? formatPesos(result.sales / daysWithSales) : "—"}
            detail={
              compareRange?.partial
                ? "La proyección del mes aparece con 3 días cargados"
                : `${daysWithSales} ${daysWithSales === 1 ? "día" : "días"} con ventas`
            }
          />
        )}
      </div>

      <section className="space-y-2">
        <h3 className="font-medium">Ventas por día</h3>
        <div className="rounded-lg border border-border p-4">
          <DailySalesChart days={result.days} />
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">Por semana</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Semana</th>
                <th className="px-3 py-2 text-right font-medium">Ventas</th>
                <th className="px-3 py-2 text-right font-medium">Facturas</th>
                <th className="px-3 py-2 text-right font-medium">Gastos</th>
                <th className="px-3 py-2 text-right font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {weeks.map((week) => (
                <tr key={week.from}>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatDayShort(week.from)} al {formatDayShort(week.to)}
                  </td>
                  <td className="px-3 py-2 text-right"><Money value={week.sales} /></td>
                  <td className="px-3 py-2 text-right"><Money value={week.purchases} /></td>
                  <td className="px-3 py-2 text-right"><Money value={week.expenses} /></td>
                  <td className={cn("px-3 py-2 text-right font-medium", week.net < 0 && "text-destructive")}>
                    <Money value={week.net} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Es una estimación por caja: lo que entró menos lo que se pagó en cada período. Una semana con mucha compra
          se ve peor y la siguiente mejor; en el mes se compensa.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">Por día</h3>
        {activeDays.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Todavía no hay datos cargados para este mes.{" "}
            <Link href="/finanzas/planillas" className="text-primary underline-offset-4 hover:underline">
              Subí las fotos del cuaderno
            </Link>{" "}
            para empezar.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Día</th>
                  <th className="px-3 py-2 text-right font-medium">Efectivo</th>
                  <th className="px-3 py-2 text-right font-medium">Transf.</th>
                  <th className="px-3 py-2 text-right font-medium">Tarjetas</th>
                  <th className="px-3 py-2 text-right font-medium">Ventas</th>
                  <th className="px-3 py-2 text-right font-medium">Facturas</th>
                  <th className="px-3 py-2 text-right font-medium">Gastos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeDays.map((day) => (
                  <tr key={day.date}>
                    <td className="whitespace-nowrap px-3 py-2">
                      {WEEKDAY_SHORT[weekdayOf(day.date)]} {formatDayShort(day.date)}
                      {!day.hasSheet && day.sales > 0 && (
                        <span className="ml-1 text-xs text-amber-700" title="Sin hoja del cuaderno confirmada">
                          (sin hoja)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right"><Money value={day.cash} /></td>
                    <td className="px-3 py-2 text-right"><Money value={day.transfers} /></td>
                    <td className="px-3 py-2 text-right"><Money value={day.cards} /></td>
                    <td className="px-3 py-2 text-right font-medium"><Money value={day.sales} /></td>
                    <td className="px-3 py-2 text-right"><Money value={day.purchases} muted /></td>
                    <td className="px-3 py-2 text-right"><Money value={day.expenses} muted /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
