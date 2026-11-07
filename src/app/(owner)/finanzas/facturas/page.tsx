import { listSupplierInvoices } from "@/features/finanzas/queries";
import { listSuppliers } from "@/features/suppliers/queries";
import { formatPesos } from "@/features/finanzas/money";
import { formatDayLong, monthRange, parseMonthParam } from "@/features/finanzas/dates";
import { MonthNav } from "@/features/finanzas/components/month-nav";
import { SupplierInvoiceForm } from "@/features/finanzas/components/entry-forms";
import { DeleteRecordButton } from "@/features/finanzas/components/delete-record-button";

export default async function SupplierInvoicesPage({ searchParams }: { searchParams: { mes?: string | string[] } }) {
  const month = parseMonthParam(searchParams.mes);
  const { from, to } = monthRange(month);
  const [invoices, suppliers] = await Promise.all([listSupplierInvoices(from, to), listSuppliers()]);
  const total = invoices.reduce((acc, i) => acc + i.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold">Facturas de proveedores</h2>
        <p className="text-sm text-muted-foreground">Total de cada factura con IVA incluido, con la fecha de la factura.</p>
      </div>
      <SupplierInvoiceForm suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          Total del mes <span className="font-semibold tabular-nums">{formatPesos(total)}</span>
        </p>
        <MonthNav basePath="/finanzas/facturas" month={month} />
      </div>

      {invoices.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No hay facturas cargadas en este mes.</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {invoices.map((invoice) => (
            <li key={invoice.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-medium">{invoice.supplier_name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {formatDayLong(invoice.invoice_date)}
                  {invoice.invoice_number ? ` · N° ${invoice.invoice_number}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="font-semibold tabular-nums">{formatPesos(invoice.total)}</span>
                <DeleteRecordButton
                  kind="invoice"
                  id={invoice.id}
                  label={`la factura de ${invoice.supplier_name} por ${formatPesos(invoice.total)}`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
