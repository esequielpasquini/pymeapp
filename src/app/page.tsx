import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/queries";
import { NoOrganizationScreen } from "@/features/auth/components/no-organization-screen";

// Raíz: redirige según rol. El dueño va al dashboard con métricas; el
// empleado va directo al buscador (su única pantalla).
export default async function HomePage() {
  const { user, profile } = await getCurrentSession();

  if (!user) redirect("/login");
  if (!profile) return <NoOrganizationScreen email={user.email} />;
  if (profile.role === "owner") redirect("/dashboard");
  redirect("/search");
}
