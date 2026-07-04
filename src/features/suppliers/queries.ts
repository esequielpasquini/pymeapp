import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Supplier } from "@/lib/supabase/types";

export async function listSuppliers(): Promise<Supplier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("suppliers").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Supplier[];
}

/**
 * Proveedores con la cantidad de productos de cada uno (incluye inactivos;
 * es solo un numero orientativo), para la pagina de gestion de proveedores.
 * Usa el embed de PostgREST (products(count)) en vez de armar una funcion
 * RPC aparte -- mismo patron que listCategoriesWithCounts.
 */
export async function listSuppliersWithCounts(): Promise<Supplier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*, products(count)")
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row) => {
    const productsField = row.products as unknown as { count: number }[] | null;
    const { products: _products, ...supplier } = row as typeof row & {
      products?: unknown;
    };
    void _products;
    return {
      ...supplier,
      product_count: productsField?.[0]?.count ?? 0,
    } as Supplier;
  });
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
  if (error) return null;
  return data as Supplier;
}
