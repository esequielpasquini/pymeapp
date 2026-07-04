"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CategoryIcon } from "@/features/categories/components/category-icon";
import type { ProductFormState } from "@/features/products/actions";
import type { Category, Product, Supplier } from "@/lib/supabase/types";

const NO_SUPPLIER = "none";

const initialState: ProductFormState = { error: null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : label}
    </Button>
  );
}

export function ProductForm({
  action,
  product,
  categories,
  suppliers,
  defaultCategoryId,
  submitLabel,
}: {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  product?: Product;
  categories: Category[];
  suppliers: Supplier[];
  defaultCategoryId?: string;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const [categoryId, setCategoryId] = useState(product?.category_id ?? defaultCategoryId ?? "");
  const [supplierId, setSupplierId] = useState(product?.supplier_id ?? NO_SUPPLIER);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" name="brand" defaultValue={product?.brand ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplierId">Proveedor</Label>
          <input
            type="hidden"
            name="supplierId"
            value={supplierId === NO_SUPPLIER ? "" : supplierId}
          />
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger id="supplierId">
              <SelectValue placeholder="Elegi un proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SUPPLIER}>Sin proveedor</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {suppliers.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Todavia no hay proveedores creados. Anda a Proveedores y cread uno primero.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripcion *</Label>
        <Input id="description" name="description" defaultValue={product?.description ?? ""} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Categoria *</Label>
        <input type="hidden" name="categoryId" value={categoryId} required />
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="categoryId">
            <SelectValue placeholder="Elegi una categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <span className="flex items-center gap-2">
                  <CategoryIcon icon={category.icon} className="h-4 w-4" />
                  {category.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {categories.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Todavia no hay categorias creadas. Anda a Categorias y cread una primero.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Precio unitario</Label>
          <Input
            id="unitPrice"
            name="unitPrice"
            type="number"
            step="0.01"
            defaultValue={product?.unit_price ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pricePerKilo">Precio por kilo / metro / litro</Label>
          <Input
            id="pricePerKilo"
            name="pricePerKilo"
            type="number"
            step="0.01"
            defaultValue={product?.price_per_kilo ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observaciones</Label>
        <Input id="notes" name="notes" defaultValue={product?.notes ?? ""} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton label={submitLabel} />
    </form>
  );
}
