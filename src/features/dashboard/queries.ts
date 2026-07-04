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
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

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

  return {
    totalProducts: totalProducts ?? 0,
    totalSuppliers: totalSuppliers ?? 0,
    recentlyUpdatedCount: recentlyUpdatedCount ?? 0,
    openReportsCount: openReportsCount ?? 0,
    recentlyUpdatedProducts: (recentlyUpdatedProducts ?? []) as unknown as Product[],
    recentImports: (recentImports ?? []) as Import[],
  };
}
