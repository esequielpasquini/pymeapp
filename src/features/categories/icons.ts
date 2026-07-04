import {
  Wrench,
  Hammer,
  PaintBucket,
  Zap,
  Package,
  Droplet,
  Ruler,
  HardHat,
  Layers,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";

// Set curado de iconos (no cualquier nombre de lucide-react vale como
// string libre): evita que un nombre invalido rompa el render de una
// categoria. El "value" es lo que se guarda en categories.icon.
export const CATEGORY_ICON_OPTIONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "wrench", label: "Herramientas", Icon: Wrench },
  { value: "hammer", label: "Construccion", Icon: Hammer },
  { value: "paint-bucket", label: "Pintura", Icon: PaintBucket },
  { value: "zap", label: "Electricidad", Icon: Zap },
  { value: "package", label: "Materiales", Icon: Package },
  { value: "droplet", label: "Liquidos", Icon: Droplet },
  { value: "ruler", label: "Medicion", Icon: Ruler },
  { value: "hard-hat", label: "Seguridad", Icon: HardHat },
  { value: "layers", label: "Varios", Icon: Layers },
  { value: "shopping-basket", label: "General", Icon: ShoppingBasket },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  CATEGORY_ICON_OPTIONS.map((opt) => [opt.value, opt.Icon])
);

export function getCategoryIcon(icon: string): LucideIcon {
  return ICON_MAP[icon] ?? Package;
}
