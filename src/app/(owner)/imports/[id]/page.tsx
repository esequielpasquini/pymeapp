import { notFound } from "next/navigation";
import { getImport, getImportItems } from "@/features/imports/queries";
import { applyImport, cancelImport } from "@/features/imports/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

const actionBadge = {
  create: { label: "Nuevo", variant: "success" as const },
  update: { label: "Modificado", variant: "warning" as const },
  remove: { label: "Eliminado", variant: "destructive" as const },
  unchanged: { label: "Sin cambios", variant: "secondary" as const },
};

export default async function ImportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const importRow = await getImport(id);
  if (!importRow) notFound();

  const items = await getImportItems(id);
  const boundApply = applyImport.bind(null, id);
  const boundCancel = cancelImport.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{importRow.file_name}</h1>
          <p className="text-sm text-muted-foreground">
            {importRow.summary.new ?? 0} nuevos · {importRow.summary.modified ?? 0} modificados ·{" "}
            {importRow.summary.removed ?? 0} eliminados · {importRow.summary.unchanged ?? 0} sin cambios
          </p>
        </div>

        {importRow.status === "pending_review" && (
          <div className="flex gap-2">
            <form action={boundCancel}>
              <Button variant="outline" type="submit">
                Cancelar
              </Button>
            </form>
            <form action={boundApply}>
              <Button type="submit">Confirmar y aplicar cambios</Button>
            </form>
          </div>
        )}

        {importRow.status !== "pending_review" && (
          <Badge variant={importRow.status === "applied" ? "success" : "secondary"}>
            {importRow.status === "applied" ? "Aplicada" : "Cancelada"}
          </Badge>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cambio</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead className="text-right">Precio actual</TableHead>
            <TableHead className="text-right">Precio propuesto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const current = item.previous_unit_price ?? item.previous_price_per_kilo;
            const proposed = item.unit_price ?? item.price_per_kilo;
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge variant={actionBadge[item.action].variant}>{actionBadge[item.action].label}</Badge>
                </TableCell>
                <TableCell>
                  {item.brand ? `${item.brand} — ` : ""}
                  {item.description}
                </TableCell>
                <TableCell>{item.supplier_name ?? "—"}</TableCell>
                <TableCell className="text-right">{formatCurrency(current)}</TableCell>
                <TableCell className="text-right">
                  {item.action === "remove" ? "—" : formatCurrency(proposed)}
                </TableCell>
              </TableRow>
            );
          })}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                No hay cambios detectados en este archivo.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
