import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Claves de modulos conocidas -- una constante por modulo para no repetir
 * el string literal en cada lugar que lo consulta. La tabla en si acepta
 * cualquier texto (no hay enum en la base), asi que sumar un modulo nuevo
 * es: 1) habilitarlo para las organizaciones que lo compraron (insert
 * directo en organization_modules), 2) agregar su clave aca y consultarla
 * con getEnabledModules().
 */
export const MODULE_COMPRAS = "compras";
export const MODULE_PEDIDOS = "pedidos";

/**
 * Modulos habilitados para la organizacion del usuario logueado. RLS
 * (organization_modules_select, ver 0016_organization_modules.sql) ya
 * filtra por auth_org_id(), asi que no hace falta pasarle el id de
 * organizacion a mano ni preocuparse de que devuelva modulos de otro
 * negocio.
 */
export async function getEnabledModules(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_modules")
    .select("module_key")
    .eq("enabled", true);

  if (error) return new Set();
  return new Set((data ?? []).map((row) => row.module_key as string));
}
