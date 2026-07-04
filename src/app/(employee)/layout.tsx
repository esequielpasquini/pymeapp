import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/queries";
import { logout } from "@/features/auth/actions";
import { NoOrganizationScreen } from "@/features/auth/components/no-organization-screen";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

// Pantalla del empleado: mobile-first, sin barra lateral ni nada que
// distraiga del buscador. Usable desde un celular sin capacitación.
export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentSession();

  if (!user) redirect("/login");
  if (!profile) return <NoOrganizationScreen email={user.email} />;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background p-4 md:px-6 md:py-5">
        <div>
          <p className="text-sm font-semibold md:text-base">Asistente de Precios</p>
          <p className="text-xs text-muted-foreground md:text-sm">{profile.full_name}</p>
        </div>
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
