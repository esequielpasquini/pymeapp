import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonth, monthOf, shiftMonth, todayIso } from "@/features/finanzas/dates";

/** Selector de mes (?mes=YYYY-MM) con flechas anterior/siguiente. */
export function MonthNav({ basePath, month }: { basePath: string; month: string }) {
  const current = monthOf(todayIso());
  const next = shiftMonth(month, 1);
  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="outline" size="icon" className="h-9 w-9">
        <Link href={`${basePath}?mes=${shiftMonth(month, -1)}`} aria-label="Mes anterior">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>
      <span className="min-w-[9.5rem] text-center text-sm font-medium capitalize">{formatMonth(month)}</span>
      {next <= current ? (
        <Button asChild variant="outline" size="icon" className="h-9 w-9">
          <Link href={`${basePath}?mes=${next}`} aria-label="Mes siguiente">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="icon" className="h-9 w-9" disabled aria-label="Mes siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
