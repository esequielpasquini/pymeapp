import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/queries";
import { getMyOrganization } from "@/features/settings/queries";
import { logout } from "@/features/auth/actions";
import { NoOrganizationScreen } from "@/features/auth/components/no-organization-screen";
import { OwnerNav } from "@/features/dashboard/components/owner-nav";
import { MobileOwnerNav } from "@/features/dashboard/components/mobile-owner-nav";
import { OrgBrand } from "@/features/dashboard/components/org-brand";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentSession();

  if (!user) redirect("/login");
  if (!profile) return <NoOrganizationScreen email={user.email} />;
  if (profile.role !== "owner") redirect("/search");

  const organization = await getMyOrganization();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Header solo mobile/tablet (debajo de md): el aside de abajo esta
          oculto en ese rango, asi que sin esto el dueño no tiene forma de
          navegar entre pantallas desde el celular. */}
      <header className="flex items-center justify-between border-b border-border p-4 md:hidden">
        <Link href="/dashboard" className="min-w-0">
          <OrgBrand
            logoUrl={organization?.logo_url ?? null}
            name={organization?.name ?? "Asistente de Precios"}
            subtitle={profile.full_name}
          />
        </Link>
        <MobileOwnerNav onLogout={logout} />
      </header>

      <aside className="hidden w-60 shrink-0 border-r border-border bg-muted/20 p-4 md:flex md:flex-col md:justify-between">
        <div>
          <Link href="/dashboard" className="mb-6 block px-2">
            <OrgBrand
              logoUrl={organization?.logo_url ?? null}
              name={organization?.name ?? "Asistente de Precios"}
              subtitle={profile.full_name}
            />
          </Link>
          <OwnerNav />
        </div>
        <form action={logout}>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </form>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
