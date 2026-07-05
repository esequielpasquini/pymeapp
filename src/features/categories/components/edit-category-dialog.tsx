"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryForm } from "@/features/categories/components/category-form";
import { updateCategory, deleteCategory } from "@/features/categories/actions";
import type { Category } from "@/lib/supabase/types";

const DEFAULT_CATEGORY_NAME = "Sin categoria";

export function EditCategoryDialog({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const boundUpdate = updateCategory.bind(null, category.id);
  const isDefault = category.name.trim().toLowerCase() === DEFAULT_CATEGORY_NAME.toLowerCase();

  function handleDelete() {
    const productCount = category.product_count ?? 0;
    const warning =
      productCount > 0
        ? `Se va a eliminar "${category.name}" y sus ${productCount} producto(s) van a pasar a "Sin categoria". ¿Continuar?`
        : `¿Eliminar la categoria "${category.name}"?`;

    if (!window.confirm(warning)) return;

    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteCategory(category.id);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Editar ${category.name}`}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar categoria</DialogTitle>
        </DialogHeader>
        <CategoryForm action={boundUpdate} category={category} submitLabel="Guardar cambios" />

        <div className="mt-6 border-t border-border pt-4">
          {isDefault ? (
            <p className="text-xs text-muted-foreground">
              &quot;Sin categoria&quot; no se puede eliminar -- es donde caen los productos de
              categorias borradas.
            </p>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2 text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Eliminando..." : "Eliminar categoria"}
              </Button>
              {deleteError && <p className="mt-2 text-sm text-destructive">{deleteError}</p>}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
