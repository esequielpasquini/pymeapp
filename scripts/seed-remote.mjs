// scripts/seed-remote.mjs
//
// Carga datos de ejemplo en un proyecto REMOTO de Supabase (no local).
//
// Por que no usamos supabase/seed.sql para esto: ese archivo inserta
// directamente en auth.users usando crypt()/gen_salt() (pgcrypto), un patron
// que funciona en el Postgres local de `supabase start` pero no en el
// proyecto hosteado -- Supabase Auth remoto valida/gestiona auth.users con
// lógica interna (triggers, tabla identities, etc.) que un INSERT crudo no
// respeta, así que falla o deja el usuario en un estado roto.
//
// Este script hace lo mismo pero de la forma soportada: crea los usuarios
// con auth.admin.createUser() (la misma API que ya usa
// src/features/settings/actions.ts para invitar empleados) y despues inserta
// el resto de los datos via supabase-js con la service role key, que
// bypasea RLS. No hace falta la contraseña de Postgres ni psql.
//
// Uso:
//   npm run seed:remote
//   (equivale a: node --env-file=.env.remote.local scripts/seed-remote.mjs)
//
// Usamos un archivo separado de .env.local a proposito -- .env.local es tu
// entorno de desarrollo (Supabase local, puertos 543xx) y .env.remote.local
// apunta al proyecto hosteado. Asi nunca corres `npm run dev` sin querer
// contra datos remotos, ni este script sin querer contra el local.
//
// Requiere en .env.remote.local (Project Settings > API en el dashboard del
// proyecto REMOTO -- no el local):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// .env.remote.local ya queda ignorado por git (el .gitignore matchea
// ".env*.local"), asi que no hace falta tocar nada mas ahi.
//
// Es re-corrible: si la organizacion ya existe, no la duplica. Los usuarios
// tampoco se duplican (se reusa el existente si el email ya esta creado). Si
// la organizacion ya tiene productos cargados, no vuelve a insertar el lote
// de productos de ejemplo (evita duplicados en cada corrida).
//
// La contraseña de los 3 usuarios de prueba es "password123" salvo que se
// pase SEED_PASSWORD. Si esto es un proyecto real (no un staging de
// pruebas), cambiala despues de probar.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_PASSWORD = process.env.SEED_PASSWORD || "password123";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Creá .env.remote.local con esas dos variables y corré: npm run seed:remote"
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ORG_SLUG = "el-tornillo-feliz";
const ORG_NAME = "Ferreteria El Tornillo Feliz";

async function getOrCreateUser(email, fullName) {
  // auth.admin.createUser tira error si el email ya existe -- en ese caso
  // buscamos el usuario existente por email para poder re-correr el script
  // sin romper.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
  });

  if (!createError) {
    console.log(`  usuario creado: ${email} (${created.user.id})`);
    return created.user.id;
  }

  if (!/already been registered|already exists/i.test(createError.message)) {
    throw new Error(`No se pudo crear ${email}: ${createError.message}`);
  }

  // Buscar el existente. listUsers es paginado; para pocos usuarios de
  // prueba alcanza con traer la primera página con un perPage generoso.
  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) throw new Error(`No se pudo buscar ${email}: ${listError.message}`);

  const existing = list.users.find((u) => u.email === email);
  if (!existing) throw new Error(`${email} ya existe pero no lo pude encontrar en listUsers()`);

  console.log(`  usuario ya existia: ${email} (${existing.id})`);
  return existing.id;
}

async function upsertProfile(id, organizationId, fullName, role) {
  const { error } = await admin
    .from("profiles")
    .upsert({ id, organization_id: organizationId, full_name: fullName, role }, { onConflict: "id" });
  if (error) throw new Error(`No se pudo crear el perfil de ${fullName}: ${error.message}`);
}

async function getOrCreateOrganization() {
  const { data: existing } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", ORG_SLUG)
    .maybeSingle();

  if (existing) {
    console.log(`Organizacion ya existia: ${ORG_NAME} (${existing.id})`);
    return existing.id;
  }

  const { data: created, error } = await admin
    .from("organizations")
    .insert({ name: ORG_NAME, slug: ORG_SLUG })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo crear la organizacion: ${error.message}`);

  console.log(`Organizacion creada: ${ORG_NAME} (${created.id})`);
  return created.id;
}

async function upsertSupplier(organizationId, name) {
  const { data, error } = await admin
    .from("suppliers")
    .upsert({ organization_id: organizationId, name }, { onConflict: "organization_id,name" })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo crear proveedor "${name}": ${error.message}`);
  return data.id;
}

async function upsertCategory(organizationId, name, icon) {
  const { data, error } = await admin
    .from("categories")
    .upsert({ organization_id: organizationId, name, icon }, { onConflict: "organization_id,name" })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo crear categoria "${name}": ${error.message}`);
  return data.id;
}

async function main() {
  console.log("Creando usuarios de prueba...");
  const ownerId = await getOrCreateUser("dueno@eltornillofeliz.test", "Marcela (Duena)");
  const emp1Id = await getOrCreateUser("empleado1@eltornillofeliz.test", "Juan (Empleado)");
  const emp2Id = await getOrCreateUser("empleado2@eltornillofeliz.test", "Sofia (Empleada)");

  console.log("Creando organizacion...");
  const orgId = await getOrCreateOrganization();

  console.log("Asignando perfiles...");
  await upsertProfile(ownerId, orgId, "Marcela (Duena)", "owner");
  await upsertProfile(emp1Id, orgId, "Juan (Empleado)", "employee");
  await upsertProfile(emp2Id, orgId, "Sofia (Empleada)", "employee");

  console.log("Creando proveedores...");
  const supAcme = await upsertSupplier(orgId, "Acme Ferretera SA");
  const supPinturas = await upsertSupplier(orgId, "Pinturerias del Sur");
  const supElectro = await upsertSupplier(orgId, "Electro Insumos SRL");
  const supGenerico = await upsertSupplier(orgId, "Distribuidora General");

  console.log("Creando categorias...");
  const catFerreteria = await upsertCategory(orgId, "Ferreteria", "wrench");
  const catPintura = await upsertCategory(orgId, "Pintureria", "paint-bucket");
  const catElectricidad = await upsertCategory(orgId, "Electricidad", "zap");
  const catMateriales = await upsertCategory(orgId, "Materiales", "package");
  const catGeneral = await upsertCategory(orgId, "General", "shopping-basket");

  const { count: existingProducts } = await admin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId);

  if (existingProducts && existingProducts > 0) {
    console.log(
      `La organizacion ya tiene ${existingProducts} productos -- salteo el alta de productos de ejemplo.`
    );
  } else {
    console.log("Cargando productos de ejemplo...");
    const products = [
      [supAcme, catFerreteria, "Fischer", 'Tornillo autoperforante 8x1" caja x100', null, 3200, null],
      [supAcme, catFerreteria, "Fischer", 'Tornillo galvanizado 6x1/2" caja x100', null, 1850, null],
      [supAcme, catFerreteria, "Generico", 'Tornillo para chapa 10x2"', null, 45, null],
      [supAcme, catFerreteria, "Generico", "Arandela chica galvanizada", null, 12, null],
      [supAcme, catFerreteria, "Generico", "Arandela grande galvanizada", null, 22, null],
      [supAcme, catFerreteria, "Stanley", "Martillo carpintero 20oz", null, 8900, null],
      [supAcme, catFerreteria, "Stanley", "Destornillador phillips n2", null, 2100, null],
      [supAcme, catFerreteria, "Truper", "Pala punta redonda", null, 7600, null],
      [supAcme, catFerreteria, "Truper", "Pico de punta", null, 8200, null],
      [supGenerico, catMateriales, "Generico", 'Clavo punta paris 2" (kg)', 2400, null, "se vende por kilo"],
      [supGenerico, catMateriales, "Generico", "Alambre negro n17 (kg)", 3100, null, "se vende por kilo"],
      [supGenerico, catMateriales, "Generico", "Cemento portland x50kg", null, 9800, null],
      [supGenerico, catMateriales, "Generico", "Cal hidratada x25kg", null, 4200, null],
      [supGenerico, catMateriales, "Generico", "Arena gruesa (kg)", 180, null, null],
      [supGenerico, catMateriales, "Generico", "Piedra partida (kg)", 150, null, null],
      [supPinturas, catPintura, "Alba", "Latex interior blanco 20L", null, 45000, null],
      [supPinturas, catPintura, "Alba", "Latex interior blanco 4L", null, 11500, null],
      [supPinturas, catPintura, "Sherwin Williams", "Esmalte sintetico brillante 1L blanco", null, 8900, null],
      [supPinturas, catPintura, "Sherwin Williams", "Esmalte sintetico brillante 1L negro", null, 8900, null],
      [supPinturas, catPintura, "Generico", "Rodillo lana 22cm", null, 3400, null],
      [supPinturas, catPintura, "Generico", 'Pincel 1"', null, 1200, null],
      [supPinturas, catPintura, "Generico", 'Pincel 2"', null, 1900, null],
      [supPinturas, catPintura, "Generico", "Bandeja para pintura", null, 2500, null],
      [supPinturas, catPintura, "Generico", "Lija al agua grano 120", null, 350, null],
      [supElectro, catElectricidad, "Philips", "Lampara led 9w luz calida", null, 1450, null],
      [supElectro, catElectricidad, "Philips", "Lampara led 12w luz fria", null, 1800, null],
      [
        supElectro,
        catElectricidad,
        "Generico",
        "Cable unipolar 2.5mm (metro)",
        950,
        null,
        "se vende por metro (usamos precio_kilo como precio_unidad_medida)",
      ],
      [supElectro, catElectricidad, "Generico", "Cable unipolar 1.5mm (metro)", 650, null, "se vende por metro"],
      [supElectro, catElectricidad, "Generico", "Llave termica 16A", null, 6200, null],
      [supElectro, catElectricidad, "Generico", "Toma corriente doble", null, 2100, null],
      [null, catGeneral, "Sin proveedor asignado", "Producto cargado sin precio (ejemplo)", null, null, "pendiente de cotizar"],
    ];

    const rows = products.map(([supplierId, categoryId, brand, description, pricePerKilo, unitPrice, notes]) => ({
      organization_id: orgId,
      supplier_id: supplierId,
      category_id: categoryId,
      brand,
      description,
      price_per_kilo: pricePerKilo,
      unit_price: unitPrice,
      notes,
      updated_by: ownerId,
    }));

    const { data: insertedProducts, error: productsError } = await admin
      .from("products")
      .insert(rows)
      .select("id, description");
    if (productsError) throw new Error(`No se pudieron cargar los productos: ${productsError.message}`);

    console.log(`  ${insertedProducts.length} productos cargados.`);

    const tornillo = insertedProducts.find((p) => p.description.startsWith("Tornillo autoperforante"));
    if (tornillo) {
      const { error } = await admin.from("price_changes").insert({
        organization_id: orgId,
        product_id: tornillo.id,
        previous_unit_price: 2900,
        new_unit_price: 3200,
        reason: "manual",
        changed_by: ownerId,
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      });
      if (error) console.warn(`  (no se pudo cargar el historial de precio de ejemplo: ${error.message})`);
    }

    console.log("Cargando reportes de faltantes de ejemplo...");
    const { data: resolvedReport, error: reportsError } = await admin
      .from("missing_reports")
      .insert([
        {
          organization_id: orgId,
          product_name: 'Bulon 1/4 x 3" con tuerca',
          comment: "Cliente pidio 20 unidades, no lo encontre en el sistema",
          status: "open",
          reported_by: emp1Id,
          created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        {
          organization_id: orgId,
          product_name: "Pintura para pizarron",
          status: "open",
          reported_by: emp2Id,
          created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        },
        {
          organization_id: orgId,
          product_name: "Silicona transparente",
          comment: "Se pregunta seguido y no tenemos precio cargado",
          status: "resolved",
          reported_by: emp1Id,
          created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
      ])
      .select("id, status");
    if (reportsError) throw new Error(`No se pudieron cargar los reportes: ${reportsError.message}`);

    const resolved = resolvedReport.find((r) => r.status === "resolved");
    if (resolved) {
      await admin
        .from("missing_reports")
        .update({ resolved_by: ownerId, resolved_at: new Date(Date.now() - 4 * 86400000).toISOString() })
        .eq("id", resolved.id);
    }
  }

  console.log("\nListo. Usuarios de prueba (contraseña: " + SEED_PASSWORD + "):");
  console.log("  dueno@eltornillofeliz.test (owner)");
  console.log("  empleado1@eltornillofeliz.test (employee)");
  console.log("  empleado2@eltornillofeliz.test (employee)");
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
