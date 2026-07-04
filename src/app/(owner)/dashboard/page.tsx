import Link from "next/link";
import { getDashboardStats } from "@/features/dashboard/queries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Package, Truck, Clock, AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: "Productos activos", value: stats.totalProducts, icon: Package, href: "/products" },
    { label: "Proveedores", value: stats.totalSuppliers, icon: Truck, href: "/products" },
    { label: "Actualizados (7 días)", value: stats.recentlyUpdatedCount, icon: Clock, href: "/products" },
    { label: "Reportes pendientes", value: stats.openReportsCount, icon: AlertCircle, href: "/missing-products" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Panel</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-3xl font-semibold">{value}</p>
                </div>
                <Icon className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

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
