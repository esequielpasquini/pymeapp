import { SearchHomeView } from "@/features/products/views/search-home-view";

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <SearchHomeView q={q} basePath="/ventas" />;
}
