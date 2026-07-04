import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MissingReport } from "@/lib/supabase/types";

export async function listReports(status?: "open" | "resolved"): Promise<MissingReport[]> {
  const supabase = await createClient();
  let q = supabase.from("missing_reports").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as MissingReport[];
}

export type MostReportedItem = { product_name: string; count: number };

/** Ranking simple de nombres más reportados (agrupado en el cliente porque
 * el volumen de reportes de un comercio chico es bajo — no hace falta una
 * agregación SQL especial). */
export async function mostReported(limit = 10): Promise<MostReportedItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("missing_reports").select("product_name");
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const key = row.product_name.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([product_name, count]) => ({ product_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
