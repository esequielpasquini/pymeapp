"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUserResponse } from "@/lib/supabase/get-verified-user";
import { MODULE_FINANZAS } from "@/features/modules/queries";
import { readSheetPhoto, SheetReaderNotConfiguredError } from "@/features/finanzas/sheet-reader";
import { isValidDate, resolveSheetDate } from "@/features/finanzas/dates";
import { parsePesos } from "@/features/finanzas/money";
import type { CardMethod, SheetPaymentMethod } from "@/features/finanzas/types";

export type FinanzasActionState = { error: string | null; success?: boolean };

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type PhotoType = (typeof ALLOWED_PHOTO_TYPES)[number];
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

/**
 * Todas las acciones del modulo: usuario logueado, dueño, y modulo
 * "finanzas" habilitado para su organizacion. RLS ya bloquea a los
 * empleados a nivel base; esto da un mensaje claro en vez de un error
 * generico.
 */
async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getSessionUserResponse(supabase);
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "owner") {
    return { error: "Solo el dueño puede usar Finanzas." } as const;
  }

  const { data: moduleRow } = await supabase
    .from("organization_modules")
    .select("module_key")
    .eq("module_key", MODULE_FINANZAS)
    .eq("enabled", true)
    .maybeSingle();
  if (!moduleRow) return { error: "El módulo Finanzas no está habilitado." } as const;

  return { supabase, userId: user.id, orgId: profile.organization_id as string, error: null } as const;
}

function revalidateFinanzas() {
  revalidatePath("/finanzas", "layout");
}

function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return !!match && isValidDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

// ─────────────────────────────────────────────────────────────
// Hojas del cuaderno
// ─────────────────────────────────────────────────────────────

export type UploadSheetResult = { sheetId: string | null; error: string | null; aiError: string | null };

/**
 * Sube la foto de una hoja, crea un borrador y le pide a la IA que lea los
 * montos. Si la IA falla (sin API key, error de red, foto ilegible) el
 * borrador queda creado igual, vacio, para cargarlo a mano mirando la foto.
 * La foto llega ya achicada desde el navegador (ver sheet-upload.tsx).
 */
export async function uploadSheetPhoto(formData: FormData): Promise<UploadSheetResult> {
  const ctx = await requireOwner();
  if (ctx.error) return { sheetId: null, error: ctx.error, aiError: null };
  const { supabase, userId, orgId } = ctx;

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { sheetId: null, error: "Elegí una foto.", aiError: null };
  }
  if (!ALLOWED_PHOTO_TYPES.includes(photo.type as PhotoType)) {
    return { sheetId: null, error: "La foto tiene que ser JPG, PNG o WebP.", aiError: null };
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return { sheetId: null, error: "La foto es demasiado grande.", aiError: null };
  }

  const extension = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
  const path = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const bytes = Buffer.from(await photo.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("sales-sheets")
    .upload(path, bytes, { contentType: photo.type });
  if (uploadError) return { sheetId: null, error: "No se pudo subir la foto.", aiError: null };

  const { data: sheet, error: sheetError } = await supabase
    .from("daily_sheets")
    .insert({ organization_id: orgId, photo_path: path, created_by: userId })
    .select("id")
    .single();
  if (sheetError || !sheet) return { sheetId: null, error: "No se pudo crear la hoja.", aiError: null };

  let aiError: string | null = null;
  try {
    const { reading, usage } = await readSheetPhoto(bytes.toString("base64"), photo.type as PhotoType);
    await supabase
      .from("daily_sheets")
      .update({
        sheet_date: resolveSheetDate(reading.day, reading.month),
        opening_cash: reading.opening_cash,
        ai_result: { reading, usage },
      })
      .eq("id", sheet.id);

    if (reading.entries.length > 0) {
      const { error: entriesError } = await supabase.from("daily_sheet_entries").insert(
        reading.entries.map((entry, index) => ({
          sheet_id: sheet.id,
          amount: entry.amount,
          payment_method: entry.enclosed ? "transferencia" : "efectivo",
          needs_review: entry.uncertain,
          position: index,
        }))
      );
      if (entriesError) aiError = "La IA leyó la hoja pero no se pudieron guardar los montos.";
    }
  } catch (error) {
    aiError =
      error instanceof SheetReaderNotConfiguredError
        ? "La lectura automática no está configurada todavía (falta la clave de la API). Cargá los montos a mano."
        : "No se pudo leer la foto automáticamente. Cargá los montos a mano mirando la foto.";
    console.error("readSheetPhoto failed", error);
    await supabase.from("daily_sheets").update({ ai_result: { error: aiError } }).eq("id", sheet.id);
  }

  revalidateFinanzas();
  return { sheetId: sheet.id, error: null, aiError };
}

/** Hoja vacia, sin foto, para cargar un dia a mano. */
export async function createEmptySheet() {
  const ctx = await requireOwner();
  if (ctx.error) throw new Error(ctx.error);
  const { data: sheet, error } = await ctx.supabase
    .from("daily_sheets")
    .insert({ organization_id: ctx.orgId, created_by: ctx.userId })
    .select("id")
    .single();
  if (error || !sheet) throw new Error("No se pudo crear la hoja.");
  revalidateFinanzas();
  redirect(`/finanzas/planillas/${sheet.id}`);
}

export type SheetEntryInput = { amount: number; payment_method: SheetPaymentMethod };

/**
 * Guarda la revision de una hoja (fecha, inicio y montos). Con confirm =
 * true ademas la pasa a "confirmada" (empieza a contar en los resultados).
 * Una hoja ya confirmada se puede seguir corrigiendo: sigue confirmada.
 */
export async function saveSheet(
  sheetId: string,
  input: { sheetDate: string | null; openingCash: number | null; entries: SheetEntryInput[] },
  confirm: boolean
): Promise<FinanzasActionState> {
  const ctx = await requireOwner();
  if (ctx.error) return { error: ctx.error };
  const { supabase } = ctx;

  const { data: current } = await supabase.from("daily_sheets").select("id, status").eq("id", sheetId).single();
  if (!current) return { error: "No se encontró la hoja." };

  if (input.sheetDate !== null && !isIsoDate(input.sheetDate)) return { error: "La fecha no es válida." };
  const willBeConfirmed = confirm || current.status === "confirmada";
  if (willBeConfirmed && !input.sheetDate) return { error: "Elegí la fecha de la hoja antes de confirmar." };

  const entries = input.entries.filter((e) => Number.isFinite(e.amount) && e.amount > 0);
  if (input.entries.length !== entries.length) return { error: "Hay montos vacíos o inválidos." };
  if (entries.some((e) => e.payment_method !== "efectivo" && e.payment_method !== "transferencia")) {
    return { error: "Medio de pago inválido." };
  }
  if (input.openingCash !== null && !(input.openingCash >= 0)) return { error: "El inicio de caja no es válido." };

  const { error: updateError } = await supabase
    .from("daily_sheets")
    .update({
      sheet_date: input.sheetDate,
      opening_cash: input.openingCash,
      status: willBeConfirmed ? "confirmada" : "borrador",
    })
    .eq("id", sheetId);
  if (updateError) {
    // daily_sheets_one_confirmed_per_day
    if (updateError.code === "23505") {
      return { error: "Ya hay otra hoja confirmada para ese día. Revisá la fecha o borrá la hoja repetida." };
    }
    return { error: "No se pudo guardar la hoja." };
  }

  // Reemplazo completo de los montos (mismo criterio que updateOrderItems).
  const { error: deleteError } = await supabase.from("daily_sheet_entries").delete().eq("sheet_id", sheetId);
  if (deleteError) return { error: "No se pudieron actualizar los montos." };
  if (entries.length > 0) {
    const { error: insertError } = await supabase.from("daily_sheet_entries").insert(
      entries.map((entry, index) => ({
        sheet_id: sheetId,
        amount: entry.amount,
        payment_method: entry.payment_method,
        // Lo que guarda el dueño ya esta revisado.
        needs_review: false,
        position: index,
      }))
    );
    if (insertError) return { error: "No se pudieron guardar los montos." };
  }

  revalidateFinanzas();
  return { error: null, success: true };
}

export async function deleteSheet(sheetId: string): Promise<FinanzasActionState> {
  const ctx = await requireOwner();
  if (ctx.error) return { error: ctx.error };
  const { supabase } = ctx;

  const { data: sheet } = await supabase.from("daily_sheets").select("photo_path").eq("id", sheetId).single();
  const { error } = await supabase.from("daily_sheets").delete().eq("id", sheetId);
  if (error) return { error: "No se pudo borrar la hoja." };
  if (sheet?.photo_path) await supabase.storage.from("sales-sheets").remove([sheet.photo_path]);

  revalidateFinanzas();
  return { error: null, success: true };
}

// ─────────────────────────────────────────────────────────────
// Tarjetas, facturas y gastos (carga manual)
// ─────────────────────────────────────────────────────────────

function readDate(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return isIsoDate(value) ? value : null;
}

function readAmount(formData: FormData, field: string): number | null {
  return parsePesos(String(formData.get(field) ?? ""));
}

function readText(formData: FormData, field: string, max = 200): string | null {
  const value = String(formData.get(field) ?? "").trim().slice(0, max);
  return value || null;
}

export async function addCardPayment(_prev: FinanzasActionState, formData: FormData): Promise<FinanzasActionState> {
  const ctx = await requireOwner();
  if (ctx.error) return { error: ctx.error };

  const date = readDate(formData, "date");
  const amount = readAmount(formData, "amount");
  const method = String(formData.get("method") ?? "") as CardMethod;
  if (!date) return { error: "Elegí la fecha." };
  if (method !== "debito" && method !== "credito") return { error: "Elegí débito o crédito." };
  if (!amount) return { error: "Escribí un monto válido." };

  const { error } = await ctx.supabase.from("card_payments").insert({
    organization_id: ctx.orgId,
    payment_date: date,
    method,
    amount,
    note: readText(formData, "note"),
    created_by: ctx.userId,
  });
  if (error) return { error: "No se pudo guardar el cobro." };

  revalidateFinanzas();
  return { error: null, success: true };
}

export async function addSupplierInvoice(
  _prev: FinanzasActionState,
  formData: FormData
): Promise<FinanzasActionState> {
  const ctx = await requireOwner();
  if (ctx.error) return { error: ctx.error };

  const date = readDate(formData, "date");
  const total = readAmount(formData, "total");
  const supplierId = readText(formData, "supplierId");
  if (!date) return { error: "Elegí la fecha." };
  if (!supplierId) return { error: "Elegí el proveedor." };
  if (!total) return { error: "Escribí un total válido." };

  const { data: supplier } = await ctx.supabase.from("suppliers").select("id, name").eq("id", supplierId).single();
  if (!supplier) return { error: "No se encontró el proveedor." };

  const { error } = await ctx.supabase.from("supplier_invoices").insert({
    organization_id: ctx.orgId,
    invoice_date: date,
    supplier_id: supplier.id,
    supplier_name: supplier.name,
    invoice_number: readText(formData, "invoiceNumber", 50),
    total,
    created_by: ctx.userId,
  });
  if (error) return { error: "No se pudo guardar la factura." };

  revalidateFinanzas();
  return { error: null, success: true };
}

export async function addExpense(_prev: FinanzasActionState, formData: FormData): Promise<FinanzasActionState> {
  const ctx = await requireOwner();
  if (ctx.error) return { error: ctx.error };

  const date = readDate(formData, "date");
  const amount = readAmount(formData, "amount");
  const category = readText(formData, "category", 60);
  if (!date) return { error: "Elegí la fecha." };
  if (!category) return { error: "Elegí o escribí el rubro." };
  if (!amount) return { error: "Escribí un monto válido." };

  const { error } = await ctx.supabase.from("expenses").insert({
    organization_id: ctx.orgId,
    expense_date: date,
    category,
    description: readText(formData, "description"),
    amount,
    created_by: ctx.userId,
  });
  if (error) return { error: "No se pudo guardar el gasto." };

  revalidateFinanzas();
  return { error: null, success: true };
}

const DELETABLE = {
  card: "card_payments",
  invoice: "supplier_invoices",
  expense: "expenses",
} as const;

export async function deleteFinanzasRecord(
  kind: keyof typeof DELETABLE,
  id: string
): Promise<FinanzasActionState> {
  const ctx = await requireOwner();
  if (ctx.error) return { error: ctx.error };
  const table = DELETABLE[kind];
  if (!table) return { error: "Registro inválido." };

  const { error } = await ctx.supabase.from(table).delete().eq("id", id);
  if (error) return { error: "No se pudo borrar." };

  revalidateFinanzas();
  return { error: null, success: true };
}
