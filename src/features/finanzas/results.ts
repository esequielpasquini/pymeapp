import { daysBetween, weekdayOf } from "@/features/finanzas/dates";
import type { DayResult, PeriodResult, CardMethod, SheetPaymentMethod } from "@/features/finanzas/types";

/**
 * Calculo de resultados de un periodo. Funcion pura (sin Supabase) para que
 * se pueda probar con datos de ejemplo y para que la regla de negocio viva
 * en un solo lugar:
 *
 *   ventas        = efectivo + transferencias (cuaderno) + tarjetas
 *   margen bruto  = ventas - facturas de proveedores
 *   ganancia neta = margen bruto - otros gastos
 *
 * Es una estimacion por "caja" (lo que entro vs. lo que se pago en el
 * periodo), no por costo de lo vendido: el sistema no sabe cuanto costo
 * cada producto. Una semana con mucha compra se ve peor y la siguiente
 * mejor; en el mes se compensa.
 */
export type ResultInputs = {
  from: string;
  to: string;
  today: string;
  sheetEntries: { date: string; amount: number; payment_method: SheetPaymentMethod }[];
  /** Fechas con hoja confirmada (aunque no tenga montos). */
  sheetDates: string[];
  cardPayments: { date: string; amount: number; method: CardMethod }[];
  invoices: { date: string; total: number }[];
  expenses: { date: string; amount: number; category: string }[];
  draftCount: number;
};

const SUNDAY = 0;

export function computePeriodResult(input: ResultInputs): PeriodResult {
  const days = new Map<string, DayResult>();
  for (const date of daysBetween(input.from, input.to)) {
    days.set(date, { date, hasSheet: false, cash: 0, transfers: 0, cards: 0, sales: 0, purchases: 0, expenses: 0 });
  }
  const dayOf = (date: string) => days.get(date);

  for (const date of input.sheetDates) {
    const day = dayOf(date);
    if (day) day.hasSheet = true;
  }

  let debit = 0;
  let credit = 0;
  const byCategory = new Map<string, number>();

  for (const entry of input.sheetEntries) {
    const day = dayOf(entry.date);
    if (!day) continue;
    if (entry.payment_method === "transferencia") day.transfers += entry.amount;
    else day.cash += entry.amount;
  }
  for (const payment of input.cardPayments) {
    const day = dayOf(payment.date);
    if (!day) continue;
    day.cards += payment.amount;
    if (payment.method === "debito") debit += payment.amount;
    else credit += payment.amount;
  }
  for (const invoice of input.invoices) {
    const day = dayOf(invoice.date);
    if (day) day.purchases += invoice.total;
  }
  for (const expense of input.expenses) {
    const day = dayOf(expense.date);
    if (!day) continue;
    day.expenses += expense.amount;
    byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + expense.amount);
  }

  const dayList = Array.from(days.values());
  for (const day of dayList) day.sales = day.cash + day.transfers + day.cards;

  const sum = (pick: (d: DayResult) => number) => dayList.reduce((acc, d) => acc + pick(d), 0);
  const cash = sum((d) => d.cash);
  const transfers = sum((d) => d.transfers);
  const cards = sum((d) => d.cards);
  const sales = cash + transfers + cards;
  const purchases = sum((d) => d.purchases);
  const expenses = sum((d) => d.expenses);

  return {
    from: input.from,
    to: input.to,
    cash,
    transfers,
    cards,
    debit,
    credit,
    sales,
    purchases,
    grossMargin: sales - purchases,
    expenses,
    netProfit: sales - purchases - expenses,
    expensesByCategory: Array.from(byCategory, ([category, amount]) => ({ category, amount })).sort(
      (a, b) => b.amount - a.amount
    ),
    days: dayList,
    // Domingo se asume cerrado. Hoy tampoco cuenta: la hoja todavia se esta
    // escribiendo.
    missingDays: dayList
      .filter((d) => !d.hasSheet && d.date < input.today && weekdayOf(d.date) !== SUNDAY)
      .map((d) => d.date),
    draftCount: input.draftCount,
  };
}

export type WeekResult = {
  from: string;
  to: string;
  sales: number;
  purchases: number;
  expenses: number;
  net: number;
};

/** Agrupa los dias en semanas de lunes a domingo (recortadas al periodo). */
export function groupByWeek(days: DayResult[]): WeekResult[] {
  const weeks: WeekResult[] = [];
  let current: WeekResult | null = null;
  for (const day of days) {
    if (!current || weekdayOf(day.date) === 1) {
      current = { from: day.date, to: day.date, sales: 0, purchases: 0, expenses: 0, net: 0 };
      weeks.push(current);
    }
    current.to = day.date;
    current.sales += day.sales;
    current.purchases += day.purchases;
    current.expenses += day.expenses;
    current.net = current.sales - current.purchases - current.expenses;
  }
  return weeks;
}
