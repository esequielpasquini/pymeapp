"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  updateOrganizationDescription,
  type DescriptionFormState,
} from "@/features/settings/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const initialState: DescriptionFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Guardar descripción"}
    </Button>
  );
}

/**
 * Descripcion/tagline corta del negocio (ej. "Alimento balanceado y
 * accesorios para mascotas"). Se muestra en la pantalla de login junto al
 * logo -- ver getLoginBranding().
 */
export function OrgDescriptionForm({ currentDescription }: { currentDescription: string | null }) {
  const [state, formAction] = useFormState(updateOrganizationDescription, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="description">Descripción (se muestra en la pantalla de login)</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={currentDescription ?? ""}
          placeholder="Ej: Alimento balanceado y accesorios para mascotas"
          maxLength={200}
          rows={2}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">Descripción actualizada.</p>}
      <SubmitButton />
    </form>
  );
}
