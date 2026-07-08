import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/queries";
import { getMyOrganization } from "@/features/settings/queries";
import { getEnabledModules, MODULE_COMPRAS } from "@/features/modules/queries";
import { logout } from "@/features/auth/actions";
import { NoOrganizationScreen } from "@/features/auth/components/no-organization-screen";
import { SessionCheckIssueScreen } from "@/features/auth/components/session-check-issue-screen";
import { OrgBrand } from "@/features/dashboard/components/org-brand";
import { CartProvider } from "@/features/cart/context";
import { CartPanel } from "@/features/cart/components/cart-panel";
import { CartHeaderButton } from "@/features/cart/components/cart-header-button";
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

  const [organization, enabledModules] = await Promise.all([getMyOrganization(), getEnabledModules()]);
  const comprasEnabled = enabledModules.has(MODULE_COMPRAS);

  const content = (
    <div className="min-h-screen">
      {/* Header bien bajo a proposito: la prioridad de la pantalla es la
          busqueda y los resultados, no el nav -- ver OrgBrand compact. */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-2 md:px-6">
        <Link href="/search" className="min-w-0">
          <OrgBrand
            compact
            logoUrl={organization?.logo_url ?? null}
            name={organization?.name ?? "Asistente de Precios"}
            subtitle={profile.full_name}
          />
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          {comprasEnabled && <CartHeaderButton />}
          <form action={logout}>
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </header>
      <main className="p-4 md:px-6 md:py-4">{children}</main>
      {comprasEnabled && <CartPanel />}
    </div>
  );

  // El modulo "compras" (calculadora de venta) solo se monta si esta
  // habilitado para esta organizacion (ver features/modules) -- si no, ni
  // siquiera se crea el contexto, asi que AddToCartButton no tiene nada
  // que renderizar en ningun lado.
  return comprasEnabled ? <CartProvider>{content}</CartProvider> : content;
}
