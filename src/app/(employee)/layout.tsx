import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/queries";
import { getMyOrganization } from "@/features/settings/queries";
import { logout } from "@/features/auth/actions";
import { NoOrganizationScreen } from "@/features/auth/components/no-organization-screen";
import { SessionCheckIssueScreen } from "@/features/auth/components/session-check-issue-screen";
import { OrgBrand } from "@/features/dashboard/components/org-brand";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

// Pantalla del empleado: mobile-first, sin barra lateral ni nada que
// distraiga del buscador. Usable desde un celular sin capacitación.
export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, inconclusive } = await getCurrentSession();

  if (!user) {
    // Si no pudimos confirmar la sesion por un problema transitorio (wifi,
    // timeout, rate limit), NO mandamos a /login -- podria estar
    // perfectamente logueado. Ver getVerifiedUser().
    if (inconclusive) return <SessionCheckIssueScreen />;
    redirect("/login");
  }
  if (!profile) return <NoOrganizationScreen email={user.email} />;

  const organization = await getMyOrganization();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background p-4 md:px-6 md:py-5">
        <Link href="/search" className="min-w-0">
          <OrgBrand
            logoUrl={organization?.logo_url ?? null}
            name={organization?.name ?? "Asistente de Precios"}
            subtitle={profile.full_name}
          />
        </Link>
        <form action={logout}>
          <Button variant="ghost" size="icon" className="h-11 w-11 md:h-12 md:w-12" aria-label="Cerrar sesión">
            <LogOut className="h-5 w-5" />
          </Button>
        </form>
      </header>
      <main className="p-4 md:px-6 md:py-6">{children}</main>
    </div>
  );
}
