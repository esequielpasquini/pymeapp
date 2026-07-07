import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/queries";
import { NoOrganizationScreen } from "@/features/auth/components/no-organization-screen";
import { SessionCheckIssueScreen } from "@/features/auth/components/session-check-issue-screen";

// Raíz: redirige según rol. El dueño va al dashboard con métricas; el
// empleado va directo al buscador (su única pantalla).
export default async function HomePage() {
  const { user, profile, inconclusive } = await getCurrentSession();

  if (!user) {
    // Ver getVerifiedUser(): un error transitorio no significa que la sesion
    // sea invalida, asi que no forzamos /login en ese caso.
    if (inconclusive) return <SessionCheckIssueScreen />;
    redirect("/login");
  }
  if (!profile) return <NoOrganizationScreen email={user.email} />;
  if (profile.role === "owner") redirect("/dashboard");
  redirect("/search");
}
