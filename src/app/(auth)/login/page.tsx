import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";
import { getLoginBranding } from "@/features/auth/queries";

export default async function LoginPage() {
  const branding = await getLoginBranding();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          {branding?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logo_url}
              alt={branding.name}
              className="mb-2 h-16 w-16 rounded-full object-cover"
            />
          )}
          <CardTitle>{branding?.name ?? "Asistente de Precios"}</CardTitle>
          {branding?.description && (
            <p className="text-sm text-muted-foreground">{branding.description}</p>
          )}
          <CardDescription>Ingresá con tu email y contraseña.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
