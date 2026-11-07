import { redirect } from "next/navigation";
import { getEnabledModules, MODULE_FINANZAS } from "@/features/modules/queries";
import { FinanzasTabs } from "@/features/finanzas/components/finanzas-tabs";

/**
 * Seccion Finanzas. El layout del dueño (app/(owner)/layout.tsx) ya deja
 * afuera a los empleados; aca ademas se exige el modulo habilitado. RLS de
 * 0026_finanzas.sql es la ultima barrera: solo el dueño lee/escribe.
 */
export default async function FinanzasLayout({ children }: { children: React.ReactNode }) {
  const enabledModules = await getEnabledModules();
  if (!enabledModules.has(MODULE_FINANZAS)) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-semibold">Finanzas</h1>
          <p className="text-sm text-muted-foreground">Ventas, compras, gastos y ganancia del negocio.</p>
        </div>
        <FinanzasTabs />
      </div>
      {children}
    </div>
  );
}
