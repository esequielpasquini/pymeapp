import { listEmployees, getMyOrganization } from "@/features/settings/queries";
import { InviteEmployeeForm } from "@/features/settings/components/invite-employee-form";
import { OrgLogoForm } from "@/features/settings/components/org-logo-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const [employees, organization] = await Promise.all([listEmployees(), getMyOrganization()]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Configuración</h1>

      <Card>
        <CardHeader>
          <CardTitle>Logo del negocio</CardTitle>
        </CardHeader>
        <CardContent>
          <OrgLogoForm currentLogoUrl={organization?.logo_url ?? null} />
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
    </div>
  );
}
