"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Elegí un archivo Excel (.xlsx).");
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/imports/parse", { method: "POST", body: formData });
    const data = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo procesar el archivo.");
      return;
    }

    router.push(`/imports/${data.importId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <Input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="max-w-sm"
      />
      <Button type="submit" disabled={loading}>
        <Upload className="mr-2 h-4 w-4" />
        {loading ? "Analizando..." : "Analizar archivo"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
