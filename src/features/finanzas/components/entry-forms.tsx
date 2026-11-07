"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addCardPayment,
  addExpense,
  addSupplierInvoice,
  type FinanzasActionState,
} from "@/features/finanzas/actions";
import { todayIso } from "@/features/finanzas/dates";

const initialState: FinanzasActionState = { error: null };

/** Mismo estilo que <Input>, para los <select> nativos (mejores en celular). */
const selectClass =
  "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Guardando..." : children}
    </Button>
  );
}

/**
 * Despues de guardar bien, limpia los campos pero deja la fecha elegida:
 * lo normal es cargar varios registros del mismo dia seguidos.
 */
function useResetOnSuccess(state: FinanzasActionState, keepFields: string[]) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state.success || !formRef.current) return;
    const form = formRef.current;
    const kept = keepFields.map((name) => [name, (form.elements.namedItem(name) as HTMLInputElement | null)?.value]);
    form.reset();
    for (const [name, value] of kept) {
      const field = form.elements.namedItem(name as string) as HTMLInputElement | null;
      if (field && value !== undefined) field.value = value;
    }
    (form.querySelector("[data-autofocus]") as HTMLInputElement | null)?.focus();
    // keepFields es constante por formulario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return formRef;
}

function FormMessage({ state, success }: { state: FinanzasActionState; success: string }) {
  if (state.error) return <p className="text-sm text-destructive">{state.error}</p>;
  if (state.success) return <p className="text-sm text-green-700">{success}</p>;
  return null;
}

function DateField({ defaultDate }: { defaultDate?: string }) {
  const [today] = useState(() => todayIso());
  return (
    <div className="space-y-1">
      <Label htmlFor="date">Fecha</Label>
      <Input id="date" name="date" type="date" required defaultValue={defaultDate ?? today} max={today} />
    </div>
  );
}

export function CardPaymentForm() {
  const [state, formAction] = useFormState(addCardPayment, initialState);
  const formRef = useResetOnSuccess(state, ["date", "method"]);
  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-lg border border-border p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <DateField />
        <div className="space-y-1">
          <Label htmlFor="method">Tarjeta</Label>
          <select id="method" name="method" className={selectClass} defaultValue="debito">
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="amount">Monto</Label>
          <Input id="amount" name="amount" inputMode="decimal" placeholder="25.000" required data-autofocus />
        </div>
        <div className="space-y-1">
          <Label htmlFor="note">Nota (opcional)</Label>
          <Input id="note" name="note" placeholder="Total del día, lote..." />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>Agregar cobro</SubmitButton>
        <FormMessage state={state} success="Cobro guardado." />
      </div>
    </form>
  );
}

export function SupplierInvoiceForm({ suppliers }: { suppliers: { id: string; name: string }[] }) {
  const [state, formAction] = useFormState(addSupplierInvoice, initialState);
  const formRef = useResetOnSuccess(state, ["date"]);
  if (suppliers.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        Primero creá tus proveedores en la sección Proveedores.
      </p>
    );
  }
  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-lg border border-border p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <DateField />
        <div className="space-y-1">
          <Label htmlFor="supplierId">Proveedor</Label>
          <select id="supplierId" name="supplierId" className={selectClass} required defaultValue="">
            <option value="" disabled>
              Elegí...
            </option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="invoiceNumber">N° de factura (opcional)</Label>
          <Input id="invoiceNumber" name="invoiceNumber" placeholder="0001-00012345" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="total">Total con IVA</Label>
          <Input id="total" name="total" inputMode="decimal" placeholder="150.000" required data-autofocus />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>Agregar factura</SubmitButton>
        <FormMessage state={state} success="Factura guardada." />
      </div>
    </form>
  );
}

export function ExpenseForm({ categories }: { categories: string[] }) {
  const [state, formAction] = useFormState(addExpense, initialState);
  const formRef = useResetOnSuccess(state, ["date"]);
  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-lg border border-border p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <DateField />
        <div className="space-y-1">
          <Label htmlFor="category">Rubro</Label>
          <Input id="category" name="category" list="expense-categories" placeholder="Alquiler" required />
          <datalist id="expense-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Detalle (opcional)</Label>
          <Input id="description" name="description" placeholder="Noviembre" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="amount">Monto</Label>
          <Input id="amount" name="amount" inputMode="decimal" placeholder="80.000" required data-autofocus />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>Agregar gasto</SubmitButton>
        <FormMessage state={state} success="Gasto guardado." />
      </div>
    </form>
  );
}
