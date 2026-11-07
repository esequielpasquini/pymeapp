import Link from "next/link";
import { listSheets } from "@/features/finanzas/queries";
import { createEmptySheet } from "@/features/finanzas/actions";
import { formatPesos } from "@/features/finanzas/money";
import { formatDayLong } from "@/features/finanzas/dates";
import { SheetUpload } from "@/features/finanzas/components/sheet-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// La lectura con IA de cada foto (Server Action uploadSheetPhoto, invocada
// desde esta pagina) tarda varios segundos: se amplia el limite de duracion
// de la funcion en Vercel.
export const maxDuration = 60;

export default async function SheetsPage() {
  const sheets = await listSheets();

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-border p-4">
        <div>
          <h2 className="font-semibold">Hojas del cuaderno de ventas</h2>
          <p className="text-sm text-muted-foreground">
            Subí una foto por día (podés elegir varias juntas). La IA lee los montos: los encerrados en un recuadro o
            círculo son transferencias, el resto efectivo. Después revisás cada hoja y la confirmás.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <SheetUpload />
          <form action={createEmptySheet}>
            <Button type="submit" variant="outline">
              Cargar un día a mano
            </Button>
          </form>
        </div>
      </div>

      {sheets.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Todavía no subiste ninguna hoja.</p>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {sheets.map((sheet) => (
            <Link
              key={sheet.id}
              href={`/finanzas/planillas/${sheet.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {sheet.sheet_date ? formatDayLong(sheet.sheet_date) : "Fecha sin definir"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {sheet.entry_count} venta{sheet.entry_count === 1 ? "" : "s"} · Efectivo{" "}
                  {formatPesos(sheet.cash_total)} · Transf. {formatPesos(sheet.transfer_total)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-semibold tabular-nums">
                  {formatPesos(sheet.cash_total + sheet.transfer_total)}
                </span>
                {sheet.status === "borrador" ? (
                  <Badge variant="warning">
                    {sheet.review_count > 0 ? `Revisar (${sheet.review_count} dudosos)` : "Sin confirmar"}
                  </Badge>
                ) : (
                  <Badge variant="success">Confirmada</Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
