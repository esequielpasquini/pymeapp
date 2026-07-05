import Link from "next/link";
import { listImports } from "@/features/imports/queries";
import { UploadForm } from "@/features/imports/components/upload-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusLabel = {
  pending_review: { label: "Pendiente de revisión", variant: "warning" as const },
  applied: { label: "Aplicada", variant: "success" as const },
  cancelled: { label: "Cancelada", variant: "secondary" as const },
};

export default async function ImportsPage() {
  const imports = await listImports();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Importar lista de precios</h1>
        <p className="text-sm text-muted-foreground">
          Subí tu Excel (columnas: Marca, Descripción, Proveedor, Categoria, Precio por kilo,
          Precio unitario). La columna Categoria es opcional -- si no la incluís, los productos
          nuevos quedan en "Sin categoria" y los podés reclasificar después. Vas a ver una vista
          previa antes de aplicar cualquier cambio.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <UploadForm />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-medium">Importaciones recientes</h2>
        <div className="space-y-2">
          {imports.map((imp) => (
            <Link
              key={imp.id}
              href={`/imports/${imp.id}`}
              className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/40"
            >
              <div>
                <p className="text-sm font-medium">{imp.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(imp.created_at).toLocaleString("es-AR")} · {imp.summary.new ?? 0} nuevos ·{" "}
                  {imp.summary.modified ?? 0} modificados · {imp.summary.removed ?? 0} eliminados
                </p>
              </div>
              <Badge variant={statusLabel[imp.status].variant}>{statusLabel[imp.status].label}</Badge>
            </Link>
          ))}
          {imports.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no importaste ningún archivo.</p>
          )}
        </div>
      </div>
    </div>
  );
}
