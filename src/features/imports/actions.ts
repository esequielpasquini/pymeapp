"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function applyImport(importId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("apply_import", { p_import_id: importId });
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/imports");
  revalidatePath(`/imports/${importId}`);
  revalidatePath("/products");
  redirect(`/imports/${importId}`);
}

export async function cancelImport(importId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("imports")
    .update({ status: "cancelled" })
    .eq("id", importId)
    .eq("status", "pending_review");
  if (error) throw new Error(error.message);
  revalidatePath("/imports");
  redirect("/imports");
}
