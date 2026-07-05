"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SupplierForm } from "@/features/suppliers/components/supplier-form";
import { DeleteSupplierButton } from "@/features/suppliers/components/delete-supplier-button";
import { updateSupplier } from "@/features/suppliers/actions";
import type { Supplier } from "@/lib/supabase/types";

export function EditSupplierDialog({ supplier }: { supplier: Supplier }) {
  const [open, setOpen] = useState(false);
  const boundUpdate = updateSupplier.bind(null, supplier.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Editar ${supplier.name}`}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar proveedor</DialogTitle>
        </DialogHeader>
        <SupplierForm action={boundUpdate} supplier={supplier} submitLabel="Guardar cambios" />
        <div className="border-t border-border pt-4">
          <DeleteSupplierButton supplier={supplier} onDeleted={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
