"use client";

import { useState, useTransition } from "react";
import {
  previewBulkAdjustment,
  applyBulkAdjustment,
  type AdjustmentPreviewItem,
} from "@/features/price-adjustments/actions";
import { ROUNDING_OPTIONS } from "@/features/price-adjustments/logic";
import type { RoundingMode } from "@/lib/supabase/types";
import type { Supplier } from "@/lib/supabase/types";
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
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export function AdjustmentForm({ suppliers }: { suppliers: Supplier[] }) {
  const [supplierId, setSupplierId] = useState<string>("");
  const [percent, setPercent] = useState<string>("10");
  const [rounding, setRounding] = useState<RoundingMode>("nearest_10");
  const [items, setItems] = useState<AdjustmentPreviewItem[] | null>(null);
  const [applied, setApplied] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePreview() {
    if (!supplierId) return;
    setApplied(null);
    startTransition(async () => {
      const result = await previewBulkAdjustment(supplierId, Number(percent), rounding);
      setItems(result);
    });
  }

  function handleApply() {
    if (!supplierId) return;
    startTransition(async () => {
      const result = await applyBulkAdjustment(supplierId, Number(percent), rounding);
      setApplied(result.count);
      setItems(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Proveedor</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger>
              <SelectValue placeholder="Elegí un proveedor" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Porcentaje (+/-)</Label>
          <Input
            type="number"
            step="0.1"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            placeholder="ej: 10 o -5"
          />
        </div>

        <div className="space-y-2">
          <Label>Redondeo</Label>
          <Select value={rounding} onValueChange={(v) => setRounding(v as RoundingMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROUNDING_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={handlePreview} disabled={!supplierId || isPending} className="w-full">
            Vista previa
          </Button>
        </div>
      </div>

      {applied !== null && (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Se actualizaron {applied} productos.
        </p>
      )}

      {items && (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Precio actual</TableHead>
                <TableHead className="text-right">Precio propuesto</TableHead>
                <TableHead className="text-right">Diferencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const current = item.currentUnitPrice ?? item.currentPricePerKilo;
                const proposed = item.proposedUnitPrice ?? item.proposedPricePerKilo;
                const diff = current !== null && proposed !== null ? proposed - current : null;
                return (
                  <TableRow key={item.productId}>
                    <TableCell>
                      {item.brand ? `${item.brand} — ` : ""}
                      {item.description}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(current)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(proposed)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {diff !== null ? formatCurrency(diff) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Este proveedor no tiene productos activos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {items.length > 0 && (
            <Button onClick={handleApply} disabled={isPending}>
              {isPending ? "Aplicando..." : `Confirmar y aplicar a ${items.length} productos`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
