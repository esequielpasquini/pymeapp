"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateOrganizationLogo, type LogoFormState } from "@/features/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LogoFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Subiendo..." : "Guardar logo"}
    </Button>
  );
}

export function OrgLogoForm({ currentLogoUrl }: { currentLogoUrl: string | null }) {
  const [state, formAction] = useFormState(updateOrganizationLogo, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30">
          {currentLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentLogoUrl} alt="Logo actual" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-muted-foreground">Sin logo</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="logo">Imagen del logo</Label>
          <Input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" required />
          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP o SVG. Máximo 2MB.</p>
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">Logo actualizado.</p>}
      <SubmitButton />
    </form>
  );
}
