import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/queries";
import { getMyOrganization } from "@/features/settings/queries";
import { getEnabledModules, MODULE_COMPRAS, MODULE_PEDIDOS } from "@/features/modules/queries";
import { logout } from "@/features/auth/actions";
import { NoOrganizationScreen } from "@/features/auth/components/no-organization-screen";
import { SessionCheckIssueScreen } from "@/features/auth/components/session-check-issue-screen";
import { OwnerNav } from "@/features/dashboard/components/owner-nav";
import { MobileOwnerNav } from "@/features/dashboard/components/mobile-owner-nav";
import { OrgBrand } from "@/features/dashboard/components/org-brand";
import { CartProvider } from "@/features/cart/context";
import { CartPanel } from "@/features/cart/components/cart-panel";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, inconclusive } = await getCurrentSession();

  if (!user) {
    // Si no pudimos confirmar la sesion por un problema transitorio (wifi,
    // timeout, rate limit), NO mandamos a /login -- podria estar
    // perfectamente logueado. Ver getVerifiedUser().
    if (inconclusive) return <SessionCheckIssueScreen />;
    redirect("/login");
  }
  if (!profile) return <NoOrganizationScreen email={user.email} />;
  if (profile.role !== "owner") redirect("/search");

  const [organization, enabledModules] = await Promise.all([getMyOrganization(), getEnabledModules()]);
  const comprasEnabled = enabledModules.has(MODULE_COMPRAS);
  const pedidosEnabled = enabledModules.has(MODULE_PEDIDOS);

  const content = (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Header solo mobile/tablet (debajo de md): el aside de abajo esta
          oculto en ese rango, asi que sin esto el dueño no tiene forma de
          navegar entre pantallas desde el celular. */}
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2 md:hidden">
        <Link href="/dashboard" className="min-w-0">
          <OrgBrand
            compact
            logoUrl={organization?.logo_url ?? null}
            name={organization?.name ?? "Asistente de Precios"}
            subtitle={profile.full_name}
          />
        </Link>
        <MobileOwnerNav onLogout={logout} pedidosEnabled={pedidosEnabled} />
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
          <OwnerNav pedidosEnabled={pedidosEnabled} />
        </div>
        <form action={logout}>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </form>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
      {comprasEnabled && <CartPanel />}
    </div>
  );

  // El modulo "compras" (calculadora de venta) solo se monta si esta
  // habilitado para esta organizacion (ver features/modules).
  return comprasEnabled ? <CartProvider>{content}</CartProvider> : content;
}
