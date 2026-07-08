"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CATEGORY_ICON_OPTIONS } from "@/features/categories/icons";
import type { CategoryFormState } from "@/features/categories/actions";
import type { Category } from "@/lib/supabase/types";

const initialState: CategoryFormState = { error: null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : label}
    </Button>
  );
}

export function CategoryForm({
  action,
  category,
  submitLabel,
}: {
  action: (state: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;
  category?: Category;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const [icon, setIcon] = useState(category?.icon ?? CATEGORY_ICON_OPTIONS[0].value);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" name="name" defaultValue={category?.name ?? ""} required />
      </div>

      <div className="space-y-2">
        <Label>Icono *</Label>
        <input type="hidden" name="icon" value={icon} />
        <div className="grid grid-cols-5 gap-2">
          {CATEGORY_ICON_OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setIcon(value)}
              title={label}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md border p-3 text-xs transition-colors",
                icon === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-6 w-6" />
            </button>
          ))}
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton label={submitLabel} />
    </form>
  );
}
