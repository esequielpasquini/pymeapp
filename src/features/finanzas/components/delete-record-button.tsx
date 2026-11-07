"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteFinanzasRecord } from "@/features/finanzas/actions";

export function DeleteRecordButton({
  kind,
  id,
  label,
}: {
  kind: "card" | "invoice" | "expense";
  id: string;
  /** Lo que se va a borrar, para el mensaje de confirmacion. */
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive"
      aria-label={`Borrar ${label}`}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`¿Borrar ${label}?`)) return;
        startTransition(async () => {
          const result = await deleteFinanzasRecord(kind, id);
          if (result.error) window.alert(result.error);
        });
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
