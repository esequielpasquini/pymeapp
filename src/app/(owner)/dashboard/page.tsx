import Link from "next/link";
import { getDashboardStats } from "@/features/dashboard/queries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import { Package, Truck, Clock, AlertCircle } from "lucide-react";
import { SearchesChart } from "@/features/dashboard/components/searches-chart";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  // Un color por tile para distinguirlos de un vistazo. Reportes pendientes
  // usa ambar (atencion) solo si hay alguno abierto; en cero queda neutro.
  const cards = [
    {
      label: "Productos activos",
      value: stats.totalProducts,
      icon: Package,
      href: "/products",
      tone: "border-l-blue-500 bg-blue-50/60",
      iconTone: "bg-blue-100 text-blue-700",
    },
    {
      label: "Proveedores",
      value: stats.totalSuppliers,
      icon: Truck,
      href: "/products",
      tone: "border-l-violet-500 bg-violet-50/60",
      iconTone: "bg-violet-100 text-violet-700",
    },
    {
      label: "Actualizados (7 días)",
      value: stats.recentlyUpdatedCount,
      icon: Clock,
      href: "/products",
      tone: "border-l-emerald-500 bg-emerald-50/60",
      iconTone: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Reportes pendientes",
      value: stats.openReportsCount,
      icon: AlertCircle,
      href: "/missing-products",
      tone: stats.openReportsCount > 0 ? "border-l-amber-500 bg-amber-50/70" : "border-l-slate-300",
      iconTone: stats.openReportsCount > 0 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Panel</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href, tone, iconTone }) => (
          <Link key={label} href={href}>
            <Card className={cn("border-l-4 transition-shadow hover:shadow-md", tone)}>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <p className="text-3xl font-semibold tabular-nums">{value.toLocaleString("es-AR")}</p>
                </div>
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", iconTone)}>
                  <Icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Búsquedas por día</CardTitle>
        </CardHeader>
        <CardContent>
          <SearchesChart data={stats.searchesPerDay} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actualizados recientemente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.recentlyUpdatedProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <Link href={`/products/${p.id}`} className="hover:underline">
                  {p.description}
                </Link>
                <span className="text-muted-foreground">
                  {formatCurrency(p.unit_price ?? p.price_per_kilo)}
                </span>
              </div>
            ))}
            {stats.recentlyUpdatedProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin cambios recientes.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas importaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.recentImports.map((imp) => (
              <Link
                key={imp.id}
                href={`/imports/${imp.id}`}
                className="flex items-center justify-between text-sm hover:underline"
              >
                <span>{imp.file_name}</span>
                <span className="text-muted-foreground">
                  {new Date(imp.created_at).toLocaleDateString("es-AR")}
                </span>
              </Link>
            ))}
            {stats.recentImports.length === 0 && (
              <p className="text-sm text-muted-foreground">Todavía no importaste ningún archivo.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
