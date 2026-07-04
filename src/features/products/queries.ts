import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PriceChange, Product } from "@/lib/supabase/types";

const PAGE_SIZE = 25;

export type SearchProductsParams = {
  query?: string;
  supplierId?: string;
  categoryId?: string;
  page?: number;
  includeInactive?: boolean;
};

export type SearchProductsResult = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
};

const PRODUCT_SELECT = "*, supplier:suppliers(id, name), category:categories(id, name, icon)";

/**
 * Busqueda parcial por descripcion/marca/proveedor. Usa ILIKE sobre la
 * columna generada `search_text` (marca + descripcion), acelerado por el
 * indice GIN trigram -- suficiente para decenas de miles de productos por
 * organizacion sin depender de un motor de busqueda externo.
 */
export async function searchProducts(params: SearchProductsParams): Promise<SearchProductsResult> {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .order("description", { ascending: true })
    .range(from, to);

  if (!params.includeInactive) {
    q = q.eq("is_active", true);
  }

  if (params.supplierId) {
    q = q.eq("supplier_id", params.supplierId);
  }

  if (params.categoryId) {
    q = q.eq("category_id", params.categoryId);
  }

  if (params.query && params.query.trim().length > 0) {
    const term = params.query.trim();
    // Busca en marca, descripcion o nombre de proveedor (proveedor via join
    // no se puede ILIKE directo con or() de PostgREST facilmente, asi que
    // resolvemos supplier ids que matchean y los OR-eamos con los campos
    // propios del producto).
    const { data: matchingSuppliers } = await supabase
      .from("suppliers")
      .select("id")
      .ilike("name", `%${term}%`);

    const supplierIds = (matchingSuppliers ?? []).map((s: { id: string }) => s.id);

    const orParts = [`description.ilike.%${term}%`, `brand.ilike.%${term}%`];
    if (supplierIds.length > 0) {
      orParts.push(`supplier_id.in.(${supplierIds.join(",")})`);
    }
    q = q.or(orParts.join(","));
  }

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    products: (data ?? []) as unknown as Product[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .single();

  if (error) return null;
  return data as unknown as Product;
}

export async function getPriceHistory(productId: string): Promise<PriceChange[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("price_changes")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PriceChange[];
}

export { listSuppliers } from "@/features/suppliers/queries";
