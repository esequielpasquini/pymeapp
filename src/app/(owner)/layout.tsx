import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/queries";
import { logout } from "@/features/auth/actions";
import { NoOrganizationScreen } from "@/features/auth/components/no-organization-screen";
import { OwnerNav } from "@/features/dashboard/components/owner-nav";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentSession();

  if (!user) redirect("/login");
  if (!profile) return <NoOrganizationScreen email={user.email} />;
  if (profile.role !== "owner") redirect("/search");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-muted/20 p-4 md:flex md:flex-col md:justify-between">
        <div>
          <div className="mb-6 px-2">
            <p className="text-sm font-semibold">Asistente de Precios</p>
            <p className="text-xs text-muted-foreground">{profile.full_name}</p>
          </div>
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
