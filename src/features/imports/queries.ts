import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Import, ImportItem } from "@/lib/supabase/types";

export async function listImports(): Promise<Import[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("imports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as Import[];
}

export async function getImport(id: string): Promise<Import | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("imports").select("*").eq("id", id).single();
  if (error) return null;
  return data as Import;
}

export async function getImportItems(importId: string): Promise<ImportItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("import_items")
    .select("*")
    .eq("import_id", importId)
    .order("action");

  if (error) throw error;
  return (data ?? []) as ImportItem[];
}
