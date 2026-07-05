import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildCatalogWorkbook, type CatalogRow } from "@/features/imports/export";

// "Recrear Excel": exporta el catalogo actual (ya con cualquier edicion
// manual aplicada) para que el dueño lo pueda volver a usar como base la
// proxima vez que necesite subir cambios, sin arriesgarse a pisar precios
// que edito a mano despues de la ultima importacion.
export async function GET() {
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
    return NextResponse.json({ error: "Solo el dueño puede exportar" }, { status: 403 });
  }

  const { data: products, error } = await supabase
    .from("products")
    .select(
      "brand, description, price_per_kilo, unit_price, supplier:suppliers(name), category:categories(name)"
    )
    .eq("organization_id", profile.organization_id)
    .eq("is_active", true)
    .order("description");

  if (error) {
    return NextResponse.json({ error: "No se pudo leer el catálogo actual." }, { status: 500 });
  }

  const rows: CatalogRow[] = (products ?? []).map((p) => {
    const supplier = p.supplier as unknown as { name: string } | { name: string }[] | null;
    const supplierName = Array.isArray(supplier) ? supplier[0]?.name ?? "" : supplier?.name ?? "";
    const category = p.category as unknown as { name: string } | { name: string }[] | null;
    const categoryName = Array.isArray(category) ? category[0]?.name ?? "" : category?.name ?? "";

    return {
      Marca: p.brand ?? "",
      Descripcion: p.description,
      Proveedor: supplierName,
      Categoria: categoryName,
      "Precio por kilo": p.price_per_kilo ?? "",
      "Precio unitario": p.unit_price ?? "",
    };
  });

  const buffer = buildCatalogWorkbook(rows);
  const fecha = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="catalogo-${fecha}.xlsx"`,
    },
  });
}
