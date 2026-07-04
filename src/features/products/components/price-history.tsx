import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { PriceChange } from "@/lib/supabase/types";

const reasonLabel: Record<PriceChange["reason"], string> = {
  manual: "Manual",
  import: "Importación",
  bulk_adjustment: "Ajuste masivo",
};

export function PriceHistory({ changes }: { changes: PriceChange[] }) {
  if (changes.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay cambios de precio registrados.</p>;
  }

  return (
    <ul className="space-y-3">
      {changes.map((change) => (
        <li key={change.id} className="flex items-center justify-between border-b border-border pb-2 text-sm">
          <div>
            <p>
              {change.previous_unit_price !== null || change.new_unit_price !== null ? (
                <>
                  Unitario: {formatCurrency(change.previous_unit_price)} → {formatCurrency(change.new_unit_price)}
                </>
              ) : (
                <>
                  Por kg/m/L: {formatCurrency(change.previous_price_per_kilo)} → {formatCurrency(change.new_price_per_kilo)}
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(change.created_at).toLocaleString("es-AR")}
            </p>
          </div>
          <Badge variant="outline">{reasonLabel[change.reason]}</Badge>
        </li>
      ))}
    </ul>
  );
}
