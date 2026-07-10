import "server-only";
import { createClient } from "@/lib/supabase/server";
import { randomBrandColor } from "@/lib/brand-colors";

/**
 * Si `brand` todavia no tiene un color asignado para esta organizacion, le
 * asigna uno random que no coincida con el de ninguna otra marca de la
 * misma organizacion y lo persiste en brand_colors. Se llama desde
 * createProduct/updateProduct (features/products/actions.ts) cada vez que
 * se guarda un producto -- asi toda marca nueva que aparezca por primera
 * vez (tipeada en el campo Marca, no hay un alta de marca aparte) queda con
 * color propio sin que el dueño tenga que elegir nada a mano.
 *
 * OJO: esto no es un server action (no lleva "use server") -- es un helper
 * que llaman otros server actions, no algo que el cliente invoque directo.
 *
 * No revienta el guardado del producto si esto falla: el color es un
 * detalle visual, no tiene que bloquear la operacion principal.
 */
export async function ensureBrandColor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  brand: string | null | undefined
): Promise<void> {
  const trimmed = brand?.trim();
  if (!trimmed) return;

  const { data: existing } = await supabase
    .from("brand_colors")
    .select("id")
    .eq("organization_id", organizationId)
    .ilike("brand", trimmed)
    .maybeSingle();
  if (existing) return;

  const { data: allColors } = await supabase
    .from("brand_colors")
    .select("color")
    .eq("organization_id", organizationId);

  const color = randomBrandColor((allColors ?? []).map((row) => row.color as string));

  const { error } = await supabase.from("brand_colors").insert({
    organization_id: organizationId,
    brand: trimmed,
    color,
  });

  // 23505 = unique_violation: otra request en paralelo ya inserto esta
  // misma marca justo antes -- no es un error real, solo perdimos la
  // carrera y la marca ya quedo con color.
  if (error && (error as { code?: string }).code !== "23505") {
    console.error(`No se pudo asignar color a la marca "${trimmed}":`, error);
  }
}
