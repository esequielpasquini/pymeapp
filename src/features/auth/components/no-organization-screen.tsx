import { logout } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

/**
 * Se muestra cuando hay una sesión válida de Supabase Auth pero el usuario
 * no tiene fila en `profiles` (organization_id/role). Pasa típicamente si el
 * usuario se creó a mano desde el dashboard de Supabase sin completar el
 * paso 6 de docs/DEPLOYMENT.md (insertar en profiles), o si se borró la fila
 * de profiles por error.
 */
export function NoOrganizationScreen({ email }: { email?: string | null }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Tu cuenta no está asociada a ningún comercio</CardTitle>
          <CardDescription>
            Iniciaste sesión correctamente{email ? ` como ${email}` : ""}, pero todavía no
            existe un perfil que te vincule a una organización. Esto pasa cuando el usuario
            se crea directamente en Supabase sin dar de alta la fila correspondiente en
            la tabla <code>profiles</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Si sos el dueño del comercio, pedile a quien administra el proyecto de
            Supabase que revise la sección 6 de <code>docs/DEPLOYMENT.md</code> (alta del
            primer comercio). Si sos empleado, pedile al dueño que te agregue desde
            Configuración &gt; Agregar empleado.
          </p>
          <form action={logout}>
            <Button variant="outline" className="w-full" type="submit">
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
