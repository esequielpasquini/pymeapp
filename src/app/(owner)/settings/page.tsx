import { listEmployees, getMyOrganization } from "@/features/settings/queries";
import { listDailySearchCounts } from "@/features/search-logs/queries";
import { InviteEmployeeForm } from "@/features/settings/components/invite-employee-form";
import { OrgLogoForm } from "@/features/settings/components/org-logo-form";
import { OrgDescriptionForm } from "@/features/settings/components/org-description-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatDay(day: string): string {
  // day viene como "YYYY-MM-DD" (ver listDailySearchCounts) -- se arma la
  // fecha a mano en vez de `new Date(day)` para no depender de en que huso
  // horario corre el servidor (new Date("2026-07-13") se interpreta en UTC
  // y puede mostrar el dia anterior segun el huso local).
  const [year, month, dayOfMonth] = day.split("-").map(Number);
  return new Date(year, month - 1, dayOfMonth).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function SettingsPage() {
  const [employees, organization, dailySearchCounts] = await Promise.all([
    listEmployees(),
    getMyOrganization(),
    listDailySearchCounts(),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Configuración</h1>

      <Card>
        <CardHeader>
          <CardTitle>Logo y descripción del negocio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <OrgLogoForm currentLogoUrl={organization?.logo_url ?? null} />
          <div className="border-t border-border pt-4">
            <OrgDescriptionForm currentDescription={organization?.description ?? null} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {employees.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <span>{e.full_name}</span>
                <Badge variant={e.role === "owner" ? "default" : "secondary"}>
                  {e.role === "owner" ? "Dueño" : "Empleado"}
                </Badge>
              </div>
            ))}
          </div>
          <hr className="border-border" />
          <div>
            <p className="mb-3 text-sm font-medium">Agregar empleado</p>
            <InviteEmployeeForm />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actividad de búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          {dailySearchCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay búsquedas registradas en los últimos 14 días.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {dailySearchCounts.map((row) => (
                <div
                  key={`${row.userId ?? "sin-usuario"}-${row.day}`}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.userName}</p>
                    <p className="text-xs text-muted-foreground">{formatDay(row.day)}</p>
                  </div>
                  <Badge variant="secondary">
                    {row.count} búsqueda{row.count === 1 ? "" : "s"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
