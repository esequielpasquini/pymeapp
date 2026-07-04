"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createReport, type ReportFormState } from "@/features/missing-products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ReportFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full md:h-12 md:text-base" disabled={pending}>
      {pending ? "Enviando..." : "Enviar reporte"}
    </Button>
  );
}

export function ReportForm({ defaultName }: { defaultName?: string }) {
  const [state, formAction] = useFormState(createReport, initialState);

  if (state.success) {
    return (
      <div className="rounded-lg border border-border p-4 text-center md:p-6">
        <p className="text-sm md:text-base">¡Gracias! Le avisamos al dueño.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="productName" className="md:text-base">
          ¿Qué producto faltaba? *
        </Label>
        <Input
          id="productName"
          name="productName"
          defaultValue={defaultName}
          required
          autoFocus
          className="md:h-12 md:text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="comment" className="md:text-base">
          Comentario (opcional)
        </Label>
        <Input
          id="comment"
          name="comment"
          placeholder="ej: cliente pidió 20 unidades"
          className="md:h-12 md:text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="photo" className="md:text-base">
          Foto (opcional)
        </Label>
        <Input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          capture="environment"
          className="md:h-12 md:text-base"
        />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
