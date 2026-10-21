import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Import, Product } from "@/lib/supabase/types";

export type DashboardStats = {
  totalProducts: number;
  totalSuppliers: number;
  recentlyUpdatedCount: number;
  openReportsCount: number;
  recentlyUpdatedProducts: Product[];
  recentImports: Import[];
  searchesPerDay: DailySearchTotal[];
};

export type DailySearchTotal = {
  day: string; // YYYY-MM-DD, hora de Argentina
  count: number;
};

// Argentina no tiene horario de verano -- offset fijo, sin depender de la
// zona horaria del servidor (Vercel corre en UTC).
const AR_OFFSET = "-03:00";

function argentinaDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(date);
}

/**
 * Total de busquedas de la organizacion por dia (hora de Argentina) de los
 * ultimos `days` dias, incluyendo los dias en cero. Un count por dia en vez
 * de traer las filas y agrupar en memoria: PostgREST corta en 1000 filas
 * por request y con varios empleados buscando todo el dia se pasa rapido.
 * RLS de search_logs (0021_search_logs.sql) ya limita esto al dueño.
 */
async function getSearchesPerDay(days = 14): Promise<DailySearchTotal[]> {
  const supabase = await createClient();

  const today = argentinaDay(new Date());
  const dayKeys = Array.from({ length: days }, (_, i) => {
    const d = new Date(`${today}T12:00:00${AR_OFFSET}`);
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    return argentinaDay(d);
  });

  const results = await Promise.all(
    dayKeys.map((day) => {
      const start = new Date(`${day}T00:00:00${AR_OFFSET}`);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      return supabase
        .from("search_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());
    })
  );

  return dayKeys.map((day, i) => ({ day, count: results[i].count ?? 0 }));
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const searchesPerDayPromise = getSearchesPerDay();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalProducts },
    { count: totalSuppliers },
    { count: recentlyUpdatedCount },
    { count: openReportsCount },
    { data: recentlyUpdatedProducts },
    { data: recentImports },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("suppliers").select("*", { count: "exact", head: true }),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .gte("updated_at", sevenDaysAgo),
    supabase
      .from("missing_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("products")
      .select("*, supplier:suppliers(id, name)")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase.from("imports").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  const searchesPerDay = await searchesPerDayPromise;

  return {
    searchesPerDay,
    totalProducts: totalProducts ?? 0,
    totalSuppliers: totalSuppliers ?? 0,
    recentlyUpdatedCount: recentlyUpdatedCount ?? 0,
    openReportsCount: openReportsCount ?? 0,
    recentlyUpdatedProducts: (recentlyUpdatedProducts ?? []) as unknown as Product[],
    recentImports: (recentImports ?? []) as Import[],
  };
}
