"use client";

import { useTransition } from "react";
import { resolveReport } from "@/features/missing-products/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MissingReport } from "@/lib/supabase/types";

export function ReportRow({ report }: { report: MissingReport }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
      <div>
        <p className="font-medium">{report.product_name}</p>
        {report.comment && <p className="text-sm text-muted-foreground">{report.comment}</p>}
        {report.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={report.photo_url} alt="" className="mt-2 h-24 w-24 rounded-md object-cover" />
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(report.created_at).toLocaleString("es-AR")}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Badge variant={report.status === "open" ? "warning" : "success"}>
          {report.status === "open" ? "Abierto" : "Resuelto"}
        </Badge>
        {report.status === "open" && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => startTransition(() => resolveReport(report.id))}
          >
            Marcar resuelto
          </Button>
        )}
      </div>
    </div>
  );
}
