import Link from "next/link";
import { Download } from "lucide-react";
import { listImports } from "@/features/imports/queries";
import { UploadForm } from "@/features/imports/components/upload-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
          Subí tu Excel (columnas: Marca, Descripción, Proveedor, Categoria, Etiquetas, Precio por kilo,
          Precio unitario). Categoria y Etiquetas son opcionales -- si no incluís Categoria, los productos
          nuevos quedan en &quot;Sin categoria&quot; y los podés reclasificar después. En Etiquetas podés
          poner varias separadas por coma, punto y coma o &quot;/&quot; (ej:
          &quot;oferta, sin tacc&quot;) -- no importa si los escribís en mayúscula o minúscula. Vas a
          ver una vista previa antes de aplicar cualquier cambio.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">¿Hiciste cambios manuales después de importar?</p>
            <p className="text-xs text-muted-foreground">
              Recreá el Excel con el catálogo actual (ya con esos cambios) para usarlo de base la
              próxima vez, en vez de arriesgarte a pisarlos con un archivo viejo.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <a href="/api/exports/products" download>
              <Download className="mr-2 h-4 w-4" />
              Recrear Excel
            </a>
          </Button>
        </CardContent>
      </Card>

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
