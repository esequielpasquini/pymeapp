"use client";

import { useFormState, useFormStatus } from "react-dom";
import { inviteEmployee, type InviteFormState } from "@/features/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: InviteFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creando..." : "Agregar empleado"}
    </Button>
  );
}

export function InviteEmployeeForm() {
  const [state, formAction] = useFormState(inviteEmployee, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nombre</Label>
          <Input id="fullName" name="fullName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tempPassword">Contraseña provisoria</Label>
          <Input id="tempPassword" name="tempPassword" type="text" minLength={6} required />
        </div>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">Empleado creado. Pasale sus datos de acceso.</p>}
      <SubmitButton />
    </form>
  );
}
