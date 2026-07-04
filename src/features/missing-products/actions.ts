"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ReportFormState = { error: string | null; success?: boolean };

export async function createReport(
  _prev: ReportFormState,
  formData: FormData
): Promise<ReportFormState> {
  const productName = String(formData.get("productName") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();
  const photo = formData.get("photo");

  if (!productName) {
    return { error: "Escribí el nombre del producto." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "No se encontró tu organización." };

  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const path = `${profile.organization_id}/${Date.now()}-${photo.name}`;
    const { error: uploadError } = await supabase.storage
      .from("missing-reports")
      .upload(path, photo);

    if (!uploadError) {
      const { data: signedUrl } = await supabase.storage
        .from("missing-reports")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      photoUrl = signedUrl?.signedUrl ?? null;
    }
  }

  const { error } = await supabase.from("missing_reports").insert({
    organization_id: profile.organization_id,
    product_name: productName,
    comment: comment || null,
    photo_url: photoUrl,
    reported_by: user.id,
  });

  if (error) return { error: "No se pudo guardar el reporte." };

  revalidatePath("/missing-products");
  return { error: null, success: true };
}

export async function resolveReport(reportId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("missing_reports")
    .update({ status: "resolved", resolved_by: user?.id, resolved_at: new Date().toISOString() })
    .eq("id", reportId);

  if (error) throw new Error(error.message);
  revalidatePath("/missing-products");
}
