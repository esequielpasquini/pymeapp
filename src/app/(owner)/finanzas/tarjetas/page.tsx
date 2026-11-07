import { listCardPayments } from "@/features/finanzas/queries";
import { formatPesos } from "@/features/finanzas/money";
import { formatDayLong, monthRange, parseMonthParam } from "@/features/finanzas/dates";
import { MonthNav } from "@/features/finanzas/components/month-nav";
import { CardPaymentForm } from "@/features/finanzas/components/entry-forms";
import { DeleteRecordButton } from "@/features/finanzas/components/delete-record-button";

export default async function CardPaymentsPage({ searchParams }: { searchParams: { mes?: string | string[] } }) {
  const month = parseMonthParam(searchParams.mes);
  const { from, to } = monthRange(month);
  const payments = await listCardPayments(from, to);
  const debit = payments.filter((p) => p.method === "debito").reduce((acc, p) => acc + p.amount, 0);
  const credit = payments.filter((p) => p.method === "credito").reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold">Cobros con tarjeta</h2>
        <p className="text-sm text-muted-foreground">
          Lo ideal es un total por día y tarjeta (el cierre del posnet), pero podés cargar varios cobros en el mismo día.
        </p>
      </div>
      <CardPaymentForm />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          Débito <span className="font-semibold tabular-nums">{formatPesos(debit)}</span> · Crédito{" "}
          <span className="font-semibold tabular-nums">{formatPesos(credit)}</span> · Total{" "}
          <span className="font-semibold tabular-nums">{formatPesos(debit + credit)}</span>
        </p>
        <MonthNav basePath="/finanzas/tarjetas" month={month} />
      </div>

      {payments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No hay cobros con tarjeta en este mes.</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {payments.map((payment) => (
            <li key={payment.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="font-medium">{formatDayLong(payment.payment_date)}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {payment.method === "debito" ? "Débito" : "Crédito"}
                  {payment.note ? ` · ${payment.note}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="font-semibold tabular-nums">{formatPesos(payment.amount)}</span>
                <DeleteRecordButton
                  kind="card"
                  id={payment.id}
                  label={`el cobro de ${formatPesos(payment.amount)}`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
