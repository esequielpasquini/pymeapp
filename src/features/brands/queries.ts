import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getContrastTextColor, type BrandColor } from "@/lib/brand-colors";

/**
 * marca (normalizada, minuscula) -> {background, foreground}. El fondo sale
 * tal cual de brand_colors (ver 0020_brand_colors.sql); el texto se deriva
 * siempre al vuelo con getContrastTextColor, no se persigue -- es pura
 * funcion del fondo, guardarlo aparte solo arriesgaria a que queden
 * desincronizados.
 */
export async function getBrandColorMap(): Promise<Record<string, BrandColor>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("brand_colors").select("brand, color");
  if (error) throw error;

  const map: Record<string, BrandColor> = {};
  for (const row of data ?? []) {
    map[row.brand.trim().toLowerCase()] = {
      background: row.color,
      foreground: getContrastTextColor(row.color),
    };
  }
  return map;
}
