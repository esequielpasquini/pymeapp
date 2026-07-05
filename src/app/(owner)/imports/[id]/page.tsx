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

/**
 * Muestra un precio (unitario o por kilo) del import: el valor propuesto, y
 * si difiere del anterior, el valor anterior tachado abajo. Antes esta
 * pantalla combinaba precio unitario y precio por kilo en una sola columna
 * con "unit_price ?? price_per_kilo" -- si un producto tenia los dos, el
 * precio por kilo quedaba oculto sin que se notara. Ahora cada uno tiene su
 * propia columna y se muestra tal cual venga (o "—" si no aplica).
 */
function PriceCell({
  previous,
  proposed,
  isRemoved,
}: {
  previous: number | null;
  proposed: number | null;
  isRemoved: boolean;
}) {
  if (isRemoved) {
    return <span className="text-muted-foreground">{formatCurrency(previous)}</span>;
  }
  if (proposed === null) {
    return <span className="text-muted-foreground">—</span>;
  }
  const changed = previous !== null && previous !== proposed;
  return (
    <div>
      <p>{formatCurrency(proposed)}</p>
      {changed && (
        <p className="text-xs text-muted-foreground line-through">{formatCurrency(previous)}</p>
      )}
    </div>
  );
}

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
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Precio unitario</TableHead>
            <TableHead className="text-right">Precio x kilo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isRemoved = item.action === "remove";
            const categoryChanged =
              item.category_name !== null &&
              item.category_name.trim().toLowerCase() !==
                (item.previous_category_name ?? "").trim().toLowerCase();
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
                <TableCell>
                  {isRemoved ? (
                    "—"
                  ) : item.category_name ? (
                    <div>
                      <p>{item.category_name}</p>
                      {categoryChanged && item.previous_category_name && (
                        <p className="text-xs text-muted-foreground line-through">
                          {item.previous_category_name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin categoria (Excel no la trae)</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <PriceCell previous={item.previous_unit_price} proposed={item.unit_price} isRemoved={isRemoved} />
                </TableCell>
                <TableCell className="text-right">
                  <PriceCell
                    previous={item.previous_price_per_kilo}
                    proposed={item.price_per_kilo}
                    isRemoved={isRemoved}
                  />
                </TableCell>
              </TableRow>
            );
          })}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                No hay cambios detectados en este archivo.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
