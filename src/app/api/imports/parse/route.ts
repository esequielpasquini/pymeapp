import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseExcelBuffer, ImportParseError } from "@/features/imports/parse";
import { computeImportDiff, type ExistingProduct } from "@/features/imports/diff";

// Recibe el Excel, calcula el diff contra el catálogo actual y guarda todo
// como un `import` en estado pending_review + sus `import_items`. NO toca
// la tabla `products` — eso solo pasa cuando el dueño confirma (ver
// /api/imports/apply y la función SQL apply_import).
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    return NextResponse.json({ error: "Solo el dueño puede importar" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Adjuntá un archivo Excel" }, { status: 400 });
  }

  let rows;
  try {
    const buffer = await file.arrayBuffer();
    rows = parseExcelBuffer(buffer);
  } catch (err) {
    const message = err instanceof ImportParseError ? err.message : "No se pudo leer el archivo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("products")
    .select("id, brand, description, price_per_kilo, unit_price, supplier:suppliers(name)")
    .eq("organization_id", profile.organization_id)
    .eq("is_active", true);

  if (existingError) {
    return NextResponse.json({ error: "No se pudo leer el catálogo actual." }, { status: 500 });
  }

  const existingProducts: ExistingProduct[] = (existing ?? []).map((p) => {
    const supplier = p.supplier as unknown as { name: string } | { name: string }[] | null;
    const supplierName = Array.isArray(supplier) ? supplier[0]?.name ?? null : supplier?.name ?? null;
    return {
      id: p.id,
      brand: p.brand,
      description: p.description,
      price_per_kilo: p.price_per_kilo,
      unit_price: p.unit_price,
      supplier_name: supplierName,
    };
  });

  const { items, summary } = computeImportDiff(rows, existingProducts);

  const { data: importRow, error: importError } = await supabase
    .from("imports")
    .insert({
      organization_id: profile.organization_id,
      file_name: file.name,
      status: "pending_review",
      created_by: user.id,
      summary,
    })
    .select("id")
    .single();

  if (importError || !importRow) {
    return NextResponse.json({ error: "No se pudo crear la importación." }, { status: 500 });
  }

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from("import_items").insert(
      items.map((item) => ({
        import_id: importRow.id,
        organization_id: profile.organization_id,
        product_id: item.productId,
        action: item.action,
        brand: item.brand,
        description: item.description,
        supplier_name: item.supplierName,
        price_per_kilo: item.pricePerKilo,
        unit_price: item.unitPrice,
        previous_price_per_kilo: item.previousPricePerKilo,
        previous_unit_price: item.previousUnitPrice,
      }))
    );

    if (itemsError) {
      return NextResponse.json({ error: "No se pudieron guardar los cambios detectados." }, { status: 500 });
    }
  }

  return NextResponse.json({ importId: importRow.id });
}
