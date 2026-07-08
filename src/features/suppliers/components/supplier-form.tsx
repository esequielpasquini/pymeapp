"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplierFormState } from "@/features/suppliers/actions";
import type { Supplier } from "@/lib/supabase/types";

const initialState: SupplierFormState = { error: null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : label}
    </Button>
  );
}

export function SupplierForm({
  action,
  supplier,
  submitLabel,
}: {
  action: (state: SupplierFormState, formData: FormData) => Promise<SupplierFormState>;
  supplier?: Supplier;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" name="name" defaultValue={supplier?.name ?? ""} required />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton label={submitLabel} />
    </form>
  );
}
