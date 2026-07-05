import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Autocomplete liviano para el selector de producto del formulario de
// "reportar faltante": cualquier miembro de la organizacion (dueño o
// empleado) puede buscar, ya que ambos reportan faltantes.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const term = (searchParams.get("q") ?? "").trim();
  if (term.length < 2) {
    return NextResponse.json({ products: [] });
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, brand, description, supplier:suppliers(name)")
    .eq("is_active", true)
    .or(`description.ilike.%${term}%,brand.ilike.%${term}%`)
    .order("description")
    .limit(8);

  if (error) {
    return NextResponse.json({ error: "No se pudo buscar." }, { status: 500 });
  }

  const products = (data ?? []).map((p) => {
    const supplier = p.supplier as unknown as { name: string } | { name: string }[] | null;
    const supplierName = Array.isArray(supplier) ? supplier[0]?.name ?? null : supplier?.name ?? null;
    return { id: p.id, brand: p.brand, description: p.description, supplierName };
  });

  return NextResponse.json({ products });
}
