import { redirect } from "next/navigation";
import { getEnabledModules, MODULE_VENTAS } from "@/features/modules/queries";
import { SellView } from "@/features/sales/components/sell-view";

export default async function SellPage() {
  const enabledModules = await getEnabledModules();
  if (!enabledModules.has(MODULE_VENTAS)) redirect("/search");
  return <SellView />;
}
