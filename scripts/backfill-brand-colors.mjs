// scripts/backfill-brand-colors.mjs
//
// Asigna un color de fondo a cada marca que ya este cargada en productos y
// todavia no tenga uno en brand_colors (ver 0020_brand_colors.sql). Hace
// falta correrlo una sola vez, despues de aplicar esa migracion, para las
// marcas que ya existian antes de que ensureBrandColor
// (features/brands/ensure-brand-color.ts) empezara a asignar colores
// automaticamente en cada alta/edicion de producto. De ahi en mas no hace
// falta volver a correrlo -- pero es re-corrible sin problema: una marca
// que ya tiene color no se toca.
//
// Uso:
//   node --env-file=.env.local scripts/backfill-brand-colors.mjs
//   (o --env-file=.env.remote.local para el proyecto hosteado, mismo
//   criterio que scripts/seed-remote.mjs)
//
// Requiere en el env file:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Recorre TODAS las organizaciones -- el color se elige sin repetir ningun
// hex ya usado por otra marca de la MISMA organizacion (organizaciones
// distintas pueden compartir colores sin problema, cada una ve solo las
// suyas).

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Corré: node --env-file=.env.local scripts/backfill-brand-colors.mjs"
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Mismo generador que src/lib/brand-colors.ts (randomBrandColor + hslToHex)
// -- copiado en JS plano porque este script corre con node suelto, sin
// pasar por el build de Next/TS. Si se toca uno, tocar el otro.
function hslToHex(h, s, l) {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function randomBrandColor(usedColors) {
  const used = new Set(Array.from(usedColors, (c) => c.toLowerCase()));
  for (let attempt = 0; attempt < 50; attempt++) {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 55 + Math.floor(Math.random() * 25);
    const lightness = 42 + Math.floor(Math.random() * 22);
    const hex = hslToHex(hue, saturation, lightness);
    if (!used.has(hex.toLowerCase())) return hex;
  }
  return hslToHex(Math.floor(Math.random() * 360), 65, 50);
}

async function main() {
  const { data: orgs, error: orgsError } = await admin.from("organizations").select("id, name");
  if (orgsError) throw new Error(`No se pudieron leer las organizaciones: ${orgsError.message}`);

  for (const org of orgs) {
    console.log(`\n${org.name} (${org.id})`);

    const { data: products, error: productsError } = await admin
      .from("products")
      .select("brand")
      .eq("organization_id", org.id)
      .not("brand", "is", null);
    if (productsError) {
      throw new Error(`  No se pudieron leer los productos: ${productsError.message}`);
    }

    const distinctBrands = new Map(); // lowercase -> nombre original (primer visto)
    for (const row of products) {
      const trimmed = row.brand?.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (!distinctBrands.has(key)) distinctBrands.set(key, trimmed);
    }

    if (distinctBrands.size === 0) {
      console.log("  Sin marcas cargadas, nada que hacer.");
      continue;
    }

    const { data: existingColors, error: colorsError } = await admin
      .from("brand_colors")
      .select("brand, color")
      .eq("organization_id", org.id);
    if (colorsError) {
      throw new Error(`  No se pudieron leer los colores existentes: ${colorsError.message}`);
    }

    const usedColors = (existingColors ?? []).map((c) => c.color);
    const alreadyColored = new Set((existingColors ?? []).map((c) => c.brand.trim().toLowerCase()));

    const toInsert = [];
    for (const [key, brand] of distinctBrands) {
      if (alreadyColored.has(key)) continue;
      const color = randomBrandColor(usedColors);
      usedColors.push(color);
      toInsert.push({ organization_id: org.id, brand, color });
    }

    if (toInsert.length === 0) {
      console.log(`  Las ${distinctBrands.size} marca(s) ya tenian color.`);
      continue;
    }

    const { error: insertError } = await admin.from("brand_colors").insert(toInsert);
    if (insertError) {
      throw new Error(`  No se pudieron guardar los colores: ${insertError.message}`);
    }

    console.log(`  ${toInsert.length} marca(s) coloreada(s) (de ${distinctBrands.size} en total).`);
  }

  console.log("\nListo.");
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
