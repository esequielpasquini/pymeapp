import { getCategoryIcon } from "@/features/categories/icons";
import { cn } from "@/lib/utils";

export function CategoryIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const Icon = getCategoryIcon(icon);
  return <Icon className={cn("h-6 w-6", className)} />;
}
