import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/supabase/types";

export async function listCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Category[];
}

/**
 * Categorias con la cantidad de productos de cada una (incluye inactivos;
 * es solo un numero orientativo en la grilla, no una fuente de verdad), para
 * la grilla de iconos grandes del buscador del empleado. Usa el embed de
 * PostgREST (products(count)) en vez de armar una funcion RPC aparte.
 */
export async function listCategoriesWithCounts(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row) => {
    const productsField = row.products as unknown as { count: number }[] | null;
    const { products: _products, ...category } = row as typeof row & {
      products?: unknown;
    };
    void _products;
    return {
      ...category,
      product_count: productsField?.[0]?.count ?? 0,
    } as Category;
  });
}

export async function getCategory(id: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").eq("id", id).single();
  if (error) return null;
  return data as Category;
}
