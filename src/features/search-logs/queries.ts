import "server-only";
import { createClient } from "@/lib/supabase/server";

export type DailySearchCount = {
  userId: string | null;
  userName: string;
  day: string; // YYYY-MM-DD
  count: number;
};

/**
 * Cantidad de busquedas por usuario y dia, de los ultimos `days` dias (14
 * por default) -- para la tabla de actividad en Configuracion. Se agrupa en
 * memoria en vez de con un GROUP BY en PostgREST (mismo criterio que
 * listBrandsWithCounts): son pocas filas para una pyme, no vale la pena una
 * funcion RPC aparte.
 *
 * RLS (search_logs_select, ver 0021_search_logs.sql) ya filtra por
 * organizacion y exige is_owner(), asi que esto solo lo puede llamar el
 * dueño.
 */
export async function listDailySearchCounts(days = 14): Promise<DailySearchCount[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("search_logs")
    .select("user_id, created_at, user:profiles(full_name)")
    .gte("created_at", since.toISOString());

  if (error) throw error;

  const counts = new Map<string, DailySearchCount>();
  for (const row of data ?? []) {
    const day = (row.created_at as string).slice(0, 10);
    const userId = row.user_id as string | null;
    const userField = row.user as { full_name: string } | { full_name: string }[] | null;
    const userName = (Array.isArray(userField) ? userField[0]?.full_name : userField?.full_name) ?? "Usuario eliminado";
    const key = `${userId ?? "sin-usuario"}|${day}`;

    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { userId, userName, day, count: 1 });
    }
  }

  return Array.from(counts.values()).sort((a, b) => {
    if (a.day !== b.day) return b.day.localeCompare(a.day);
    return a.userName.localeCompare(b.userName);
  });
}
