import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSheet } from "@/features/finanzas/queries";
import { SheetEditor } from "@/features/finanzas/components/sheet-editor";
import { Badge } from "@/components/ui/badge";

export default async function SheetPage({ params }: { params: { id: string } }) {
  const sheet = await getSheet(params.id);
  if (!sheet) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/finanzas/planillas"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al cuaderno
        </Link>
        {sheet.status === "borrador" ? (
          <Badge variant="warning">Sin confirmar</Badge>
        ) : (
          <Badge variant="success">Confirmada</Badge>
        )}
      </div>
      <SheetEditor sheet={sheet} />
    </div>
  );
}
