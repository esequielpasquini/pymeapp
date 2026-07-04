import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ReportForm } from "@/features/missing-products/components/report-form";

export default async function ReportMissingPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;

  return (
    <div className="mx-auto max-w-md md:max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="md:text-xl">Reportar faltante</CardTitle>
          <CardDescription className="md:text-base">
            Le avisamos al dueño para que lo cargue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportForm defaultName={name} />
        </CardContent>
      </Card>
    </div>
  );
}
