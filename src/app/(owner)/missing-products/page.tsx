import { listReports, mostReported } from "@/features/missing-products/queries";
import { ReportRow } from "@/features/missing-products/components/report-row";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MissingProductsPage() {
  const [open, resolved, ranking] = await Promise.all([
    listReports("open"),
    listReports("resolved"),
    mostReported(),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div>
          <h1 className="text-2xl font-semibold">Productos faltantes</h1>
          <p className="text-sm text-muted-foreground">{open.length} reportes abiertos</p>
        </div>

        <div className="space-y-3">
          {open.map((r) => (
            <ReportRow key={r.id} report={r} />
          ))}
          {open.length === 0 && <p className="text-sm text-muted-foreground">No hay reportes abiertos.</p>}
        </div>

        {resolved.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-muted-foreground">Resueltos</h2>
            {resolved.map((r) => (
              <ReportRow key={r.id} report={r} />
            ))}
          </div>
        )}
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Más reportados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ranking.map((item) => (
            <div key={item.product_name} className="flex items-center justify-between text-sm">
              <span className="capitalize">{item.product_name}</span>
              <Badge variant="secondary">{item.count}</Badge>
            </div>
          ))}
          {ranking.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no hay reportes.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
