import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PriceChange, Product } from "@/lib/supabase/types";

const PAGE_SIZE = 25;

export type SearchProductsParams = {
  query?: string;
  supplierId?: string;
  categoryId?: string;
  brand?: string;
  tag?: string;
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

// Umbral de resultados para considerar que una busqueda de texto fue "puntual"
// (el empleado encontro el producto especifico que buscaba) en vez de una
// busqueda amplia/de categoria (ej. "leche", "alimento"). Solo las busquedas
// puntuales suman al ranking de "mas buscados" -- de lo contrario terminos
// genericos inflarian el contador de muchos productos sin reflejar
// popularidad real.
const SEARCH_HIT_RESULT_THRESHOLD = 8;

/**
 * Quita acentos/diacriticos (ej. "cafe" == "café") para que la busqueda no
 * dependa de que el empleado tipee la tilde correcta. Se aplica en JS al
 * termino de busqueda en vez de llamar a la funcion unaccent() de Postgres
 * (evita un round-trip extra) -- equivalente en la practica porque
 * products.search_text ya se guarda sin acentos (ver unaccent_immutable en
 * 0001_schema.sql).
 */
const COMBINING_DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(COMBINING_DIACRITICS_RE, "");
}

/**
 * Busqueda parcial por descripcion/marca/proveedor.
 *
 * IMPORTANTE: el filtro de texto matchea contra la columna generada
 * `search_text` (marca + descripcion, sin acentos) en vez de hacer ILIKE
 * separado sobre `description` y `brand` -- solo `search_text` tiene el
 * indice GIN trigram (products_search_trgm_idx). Buscar directo sobre
 * `description`/`brand` (como se hacia antes) ignora ese indice por completo
 * y fuerza un sequential scan en cada busqueda, que es la razon principal
 * por la que las busquedas se sentian lentas con el catalogo creciendo.
 */
export async function searchProducts(params: SearchProductsParams): Promise<SearchProductsResult> {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .order("brand", { ascending: true, nullsFirst: false })
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

  if (params.brand) {
    // ilike sin comodines se comporta como igualdad case-insensitive --
    // suficiente para agrupar por marca sin depender de que el dueño haya
    // tipeado siempre la misma capitalizacion.
    q = q.ilike("brand", params.brand);
  }

  if (params.tag) {
    // Los tags ya se guardan normalizados a minuscula (ver resolveTags en
    // actions.ts), asi que alcanza con normalizar el valor recibido para
    // que el filtro funcione sin importar como haya quedado en la URL.
    q = q.contains("tags", [params.tag.trim().toLowerCase()]);
  }

  if (params.query && params.query.trim().length > 0) {
    const term = params.query.trim();
    const normalizedTerm = stripAccents(term);
    // Busca por nombre de proveedor (proveedor via join no se puede ILIKE
    // directo con or() de PostgREST facilmente, asi que resolvemos supplier
    // ids que matchean y los OR-eamos con el filtro de texto propio del
    // producto). La tabla suppliers es chica (decenas de filas por
    // organizacion) asi que este round-trip adicional no pesa.
    const { data: matchingSuppliers } = await supabase
      .from("suppliers")
      .select("id")
      .ilike("name", `%${term}%`);

    const supplierIds = (matchingSuppliers ?? []).map((s: { id: string }) => s.id);

    // search_text = unaccent(marca + ' ' + descripcion), con indice GIN
    // trigram -- un solo ilike acá reemplaza los dos ilike sin indice de
    // antes (ver comentario de la funcion).
    const orParts = [`search_text.ilike.%${normalizedTerm}%`];
    if (supplierIds.length > 0) {
      orParts.push(`supplier_id.in.(${supplierIds.join(",")})`);
    }
    q = q.or(orParts.join(","));
  }

  const { data, error, count } = await q;
  if (error) throw error;

  // "Mas buscados": solo cuenta como hit puntual cuando la busqueda de texto
  // devolvio pocos resultados (ver SEARCH_HIT_RESULT_THRESHOLD). No se espera
  // esta llamada (fire-and-forget) para no sumarle latencia a la respuesta
  // de busqueda -- es un nice-to-have, no puede hacer que la busqueda en si
  // se sienta mas lenta.
  if (
    params.query &&
    params.query.trim().length >= 2 &&
    data &&
    data.length > 0 &&
    (count ?? 0) <= SEARCH_HIT_RESULT_THRESHOLD
  ) {
    const productIds = data.map((p) => (p as { id: string }).id);
    void supabase.rpc("bump_product_search_counts", { p_product_ids: productIds });
  }

  // Log basico de actividad ("cuantas busquedas hace cada usuario por dia",
  // ver features/search-logs/queries.ts): a diferencia del bump de arriba,
  // esto cuenta TODA busqueda de texto no vacia, no solo las que
  // devolvieron pocos resultados -- el objetivo aca es medir uso, no
  // popularidad de productos. Tambien fire-and-forget, mismo criterio.
  if (params.query && params.query.trim().length > 0) {
    void supabase.rpc("log_search", { p_query: params.query.trim() });
  }

  return {
    products: (data ?? []) as unknown as Product[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

/**
 * Top N de productos con al menos una busqueda puntual registrada (ver
 * bump_product_search_counts en 0015_product_search_stats.sql), para el row
 * fijo de "Mas buscados" en la pantalla de inicio de busqueda.
 */
export async function getMostSearchedProducts(limit = 5): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .gt("search_count", 0)
    .order("search_count", { ascending: false })
    .order("last_searched_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as Product[];
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

export type BrandCount = { brand: string; count: number };

/**
 * Marcas distintas (case-insensitive) con su cantidad de productos activos,
 * para la grilla de navegacion por marca del buscador del empleado. La
 * marca es texto libre en products.brand (no hay tabla propia), asi que se
 * agrupa en memoria en vez de con un GROUP BY en PostgREST.
 *
 * `categoryId` es opcional: si se pasa, solo se cuentan/listan las marcas
 * que tienen al menos un producto activo en esa categoria (ver
 * search-home-view.tsx -- entrar a "Marcas" despues de elegir una categoria
 * tiene que mostrar solo las marcas de esa categoria, no todas). Sin
 * categoria devuelve el universo completo, como antes (lo sigue usando
 * /reports, donde categoria y marca son filtros independientes, no
 * jerarquicos).
 */
export async function listBrandsWithCounts(categoryId?: string): Promise<BrandCount[]> {
  const supabase = await createClient();
  let q = supabase
    .from("products")
    .select("brand")
    .eq("is_active", true)
    .not("brand", "is", null);

  if (categoryId) {
    q = q.eq("category_id", categoryId);
  }

  const { data, error } = await q;

  if (error) throw error;

  const counts = new Map<string, BrandCount>();
  for (const row of data ?? []) {
    const brand = (row.brand as string | null)?.trim();
    if (!brand) continue;
    const key = brand.toLowerCase();
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { brand, count: 1 });
    }
  }

  return Array.from(counts.values()).sort((a, b) => a.brand.localeCompare(b.brand));
}

export type TagCount = { tag: string; count: number };

/**
 * Tags distintos con su cantidad de productos activos, para la grilla de
 * navegacion por tag. Igual que con marca: se agrupa en memoria en vez de
 * un GROUP BY en PostgREST porque tags es un array (habria que unnest-earlo
 * en SQL, y a esta escala no vale la pena la complejidad extra).
 */
export async function listTagsWithCounts(): Promise<TagCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("tags").eq("is_active", true);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const tags = (row.tags as string[] | null) ?? [];
    for (const raw of tags) {
      const tag = raw.trim().toLowerCase();
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

export type ReportProduct = {
  id: string;
  brand: string | null;
  description: string;
  unit_price: number | null;
  price_per_kilo: number | null;
};

/**
 * Lista completa (sin paginar) de productos activos para el listado de
 * precios imprimible de /reports -- a diferencia de searchProducts esto no
 * corta en PAGE_SIZE, porque el reporte tiene que mostrar todo lo que matchee
 * el filtro de una. El orden final por marca/descripcion se termina de
 * resolver en la vista (agrupando en memoria, ver ReportsPage) porque la
 * marca es texto libre y dos productos pueden tener la misma marca con
 * distinta capitalizacion.
 */
export async function listProductsForReport(params: {
  categoryId?: string;
  brand?: string;
}): Promise<ReportProduct[]> {
  const supabase = await createClient();
  let q = supabase
    .from("products")
    .select("id, brand, description, unit_price, price_per_kilo")
    .eq("is_active", true)
    .order("description", { ascending: true });

  if (params.categoryId) {
    q = q.eq("category_id", params.categoryId);
  }
  if (params.brand) {
    q = q.ilike("brand", params.brand);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ReportProduct[];
}

export type OrderableProduct = {
  id: string;
  brand: string | null;
  description: string;
};

/**
 * Productos activos de un proveedor puntual, para armar un pedido (modulo
 * "pedidos"): solo lo minimo que necesita el formulario (id/marca/descripcion,
 * sin precio -- un pedido es de cantidades, no de precios). Ordenado por
 * descripcion, misma logica que listProductsForReport.
 */
export async function listProductsBySupplier(supplierId: string): Promise<OrderableProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, brand, description")
    .eq("supplier_id", supplierId)
    .eq("is_active", true)
    .order("description", { ascending: true });

  if (error) throw error;
  return (data ?? []) as OrderableProduct[];
}

export { listSuppliers } from "@/features/suppliers/queries";
