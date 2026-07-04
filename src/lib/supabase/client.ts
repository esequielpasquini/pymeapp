"use client";

import { createBrowserClient } from "@supabase/ssr";

// Cliente de Supabase para Client Components. Usa la anon key; toda la
// autorización real la hace RLS en Postgres, no este cliente.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
