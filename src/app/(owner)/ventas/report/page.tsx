import { ReportMissingView } from "@/features/missing-products/views/report-view";

export default async function VentasReportPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; productId?: string }>;
}) {
  const { name, productId } = await searchParams;
  return <ReportMissingView name={name} productId={productId} backHref="/ventas" />;
}
