export type SheetStatus = "borrador" | "confirmada";
export type SheetPaymentMethod = "efectivo" | "transferencia";
export type CardMethod = "debito" | "credito";

export type DailySheetEntry = {
  id: string;
  amount: number;
  payment_method: SheetPaymentMethod;
  needs_review: boolean;
  position: number;
};

export type DailySheetSummary = {
  id: string;
  sheet_date: string | null;
  opening_cash: number | null;
  status: SheetStatus;
  created_at: string;
  entry_count: number;
  cash_total: number;
  transfer_total: number;
  review_count: number;
};

export type DailySheet = {
  id: string;
  sheet_date: string | null;
  opening_cash: number | null;
  status: SheetStatus;
  photo_url: string | null;
  ai_error: string | null;
  entries: DailySheetEntry[];
};

export type CardPayment = {
  id: string;
  payment_date: string;
  method: CardMethod;
  amount: number;
  note: string | null;
};

export type SupplierInvoice = {
  id: string;
  invoice_date: string;
  supplier_id: string | null;
  supplier_name: string;
  invoice_number: string | null;
  total: number;
};

export type Expense = {
  id: string;
  expense_date: string;
  category: string;
  description: string | null;
  amount: number;
};

export type DayResult = {
  date: string;
  hasSheet: boolean;
  cash: number;
  transfers: number;
  cards: number;
  sales: number;
  purchases: number;
  expenses: number;
};

export type PeriodResult = {
  from: string;
  to: string;
  cash: number;
  transfers: number;
  cards: number;
  debit: number;
  credit: number;
  sales: number;
  purchases: number;
  grossMargin: number;
  expenses: number;
  netProfit: number;
  expensesByCategory: { category: string; amount: number }[];
  days: DayResult[];
  /** Dias pasados (hasta hoy) del periodo, de lunes a sabado, sin hoja confirmada. */
  missingDays: string[];
  draftCount: number;
};
