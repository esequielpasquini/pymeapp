import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type TileItem = { id: string; name: string; count: number };

/**
 * Grilla de tiles generica (mismo look que CategoryGrid) para navegar por
 * marca o proveedor sin escribir nada. `id` es lo que se usa en la URL --
 * para marca es el nombre tal cual (encodeURIComponent lo escapa), para
 * proveedor es su id.
 */
export function SimpleTileGrid({
  items,
  basePath,
  icon: Icon,
  emptyLabel,
}: {
  items: TileItem[];
  basePath: string;
  icon: LucideIcon;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`${basePath}/${encodeURIComponent(item.id)}`}
          className="flex flex-col items-center gap-2 rounded-xl border border-border p-6 text-center transition-colors hover:bg-muted/50 active:scale-[0.97] active:bg-muted md:gap-3 md:p-8"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary md:h-20 md:w-20">
            <Icon className="h-8 w-8 md:h-10 md:w-10" />
          </div>
          <div>
            <p className="font-medium leading-snug md:text-lg">{item.name}</p>
            <p className="text-xs text-muted-foreground md:text-sm">{item.count} productos</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
