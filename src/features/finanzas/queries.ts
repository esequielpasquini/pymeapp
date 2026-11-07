import "server-only";
import { createClient } from "@/lib/supabase/server";
import { computePeriodResult } from "@/features/finanzas/results";
import { todayIso } from "@/features/finanzas/dates";
import type {
  CardPayment,
  DailySheet,
  DailySheetEntry,
  DailySheetSummary,
  Expense,
  PeriodResult,
  SheetPaymentMethod,
  SupplierInvoice,
} from "@/features/finanzas/types";

// RLS (ver 0026_finanzas.sql) ya restringe todo a la organizacion del
// usuario Y a que sea dueño: un empleado que llegara a ejecutar estas
// queries recibiria listas vacias.

type EntryRow = { amount: number | string; payment_method: SheetPaymentMethod; needs_review: boolean };

const PHOTO_URL_TTL_SECONDS = 60 * 60;

/** Hojas del cuaderno (borradores primero, despues por fecha desc). */
export async function listSheets(limit = 120): Promise<DailySheetSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_sheets")
    .select("id, sheet_date, opening_cash, status, created_at, daily_sheet_entries(amount, payment_method, needs_review)")
    .order("sheet_date", { ascending: false, nullsFirst: true })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const summaries = (data ?? []).map((row) => {
    const entries = (row.daily_sheet_entries ?? []) as EntryRow[];
    let cash = 0;
    let transfers = 0;
    let review = 0;
    for (const entry of entries) {
      if (entry.payment_method === "transferencia") transfers += Number(entry.amount);
      else cash += Number(entry.amount);
      if (entry.needs_review) review += 1;
    }
    return {
      id: row.id,
      sheet_date: row.sheet_date,
      opening_cash: row.opening_cash === null ? null : Number(row.opening_cash),
      status: row.status,
      created_at: row.created_at,
      entry_count: entries.length,
      cash_total: cash,
      transfer_total: transfers,
      review_count: review,
    } as DailySheetSummary;
  });

  // Borradores arriba: son lo que el dueño tiene pendiente de revisar.
  return [
    ...summaries.filter((s) => s.status === "borrador"),
    ...summaries.filter((s) => s.status !== "borrador"),
  ];
}

export async function getSheet(id: string): Promise<DailySheet | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_sheets")
    .select(
      "id, sheet_date, opening_cash, status, photo_path, ai_result, daily_sheet_entries(id, amount, payment_method, needs_review, position)"
    )
    .eq("id", id)
    .single();
  if (error || !data) return null;

  let photoUrl: string | null = null;
  if (data.photo_path) {
    const { data: signed } = await supabase.storage
      .from("sales-sheets")
      .createSignedUrl(data.photo_path, PHOTO_URL_TTL_SECONDS);
    photoUrl = signed?.signedUrl ?? null;
  }

  const aiResult = data.ai_result as { error?: string } | null;
  const entries = ((data.daily_sheet_entries ?? []) as DailySheetEntry[])
    .map((e) => ({ ...e, amount: Number(e.amount) }))
    .sort((a, b) => a.position - b.position);

  return {
    id: data.id,
    sheet_date: data.sheet_date,
    opening_cash: data.opening_cash === null ? null : Number(data.opening_cash),
    status: data.status,
    photo_url: photoUrl,
    ai_error: aiResult?.error ?? null,
    entries,
  };
}

export async function listCardPayments(from: string, to: string): Promise<CardPayment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("card_payments")
    .select("id, payment_date, method, amount, note")
    .gte("payment_date", from)
    .lte("payment_date", to)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) })) as CardPayment[];
}

export async function listSupplierInvoices(from: string, to: string): Promise<SupplierInvoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplier_invoices")
    .select("id, invoice_date, supplier_id, supplier_name, invoice_number, total")
    .gte("invoice_date", from)
    .lte("invoice_date", to)
    .order("invoice_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, total: Number(row.total) })) as SupplierInvoice[];
}

export async function listExpenses(from: string, to: string): Promise<Expense[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("id, expense_date, category, description, amount")
    .gte("expense_date", from)
    .lte("expense_date", to)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) })) as Expense[];
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Alquiler",
  "Sueldos",
  "Luz",
  "Agua",
  "Gas",
  "Internet y teléfono",
  "Impuestos",
  "Comisiones bancarias",
  "Mantenimiento",
  "Otros",
];

/** Rubros ya usados por el negocio + los sugeridos por default, sin repetir. */
export async function listExpenseCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("expenses").select("category").limit(1000);
  const used = (data ?? []).map((row) => row.category as string);
  return Array.from(new Set([...DEFAULT_EXPENSE_CATEGORIES, ...used])).sort((a, b) => a.localeCompare(b, "es"));
}

/** Resultados del periodo [from, to] (inclusive). Solo cuentan hojas confirmadas. */
export async function getPeriodResult(from: string, to: string): Promise<PeriodResult> {
  const supabase = await createClient();

  const [sheetsRes, draftsRes, cardPayments, invoices, expenses] = await Promise.all([
    supabase
      .from("daily_sheets")
      .select("sheet_date, daily_sheet_entries(amount, payment_method)")
      .eq("status", "confirmada")
      .gte("sheet_date", from)
      .lte("sheet_date", to),
    supabase.from("daily_sheets").select("id", { count: "exact", head: true }).eq("status", "borrador"),
    listCardPayments(from, to),
    listSupplierInvoices(from, to),
    listExpenses(from, to),
  ]);
  if (sheetsRes.error) throw sheetsRes.error;

  const sheets = sheetsRes.data ?? [];
  return computePeriodResult({
    from,
    to,
    today: todayIso(),
    sheetDates: sheets.map((s) => s.sheet_date as string),
    sheetEntries: sheets.flatMap((s) =>
      ((s.daily_sheet_entries ?? []) as { amount: number | string; payment_method: SheetPaymentMethod }[]).map((e) => ({
        date: s.sheet_date as string,
        amount: Number(e.amount),
        payment_method: e.payment_method,
      }))
    ),
    cardPayments: cardPayments.map((p) => ({ date: p.payment_date, amount: p.amount, method: p.method })),
    invoices: invoices.map((i) => ({ date: i.invoice_date, total: i.total })),
    expenses: expenses.map((e) => ({ date: e.expense_date, amount: e.amount, category: e.category })),
    draftCount: draftsRes.count ?? 0,
  });
}
