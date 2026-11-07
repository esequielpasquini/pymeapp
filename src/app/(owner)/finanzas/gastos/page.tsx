import { listExpenseCategories, listExpenses } from "@/features/finanzas/queries";
import { formatPesos } from "@/features/finanzas/money";
import { formatDayLong, monthRange, parseMonthParam } from "@/features/finanzas/dates";
import { MonthNav } from "@/features/finanzas/components/month-nav";
import { ExpenseForm } from "@/features/finanzas/components/entry-forms";
import { DeleteRecordButton } from "@/features/finanzas/components/delete-record-button";

export default async function ExpensesPage({ searchParams }: { searchParams: { mes?: string | string[] } }) {
  const month = parseMonthParam(searchParams.mes);
  const { from, to } = monthRange(month);
  const [expenses, categories] = await Promise.all([listExpenses(from, to), listExpenseCategories()]);
  const total = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold">Otros gastos</h2>
        <p className="text-sm text-muted-foreground">
          Alquiler, sueldos, servicios, impuestos y todo lo que no sea mercadería de proveedores.
        </p>
      </div>
      <ExpenseForm categories={categories} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          Total del mes <span className="font-semibold tabular-nums">{formatPesos(total)}</span>
        </p>
        <MonthNav basePath="/finanzas/gastos" month={month} />
      </div>

      {expenses.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No hay gastos cargados en este mes.</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {expenses.map((expense) => (
            <li key={expense.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {expense.category}
                  {expense.description ? ` · ${expense.description}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">{formatDayLong(expense.expense_date)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="font-semibold tabular-nums">{formatPesos(expense.amount)}</span>
                <DeleteRecordButton
                  kind="expense"
                  id={expense.id}
                  label={`el gasto de ${expense.category} por ${formatPesos(expense.amount)}`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
