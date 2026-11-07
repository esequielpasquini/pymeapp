"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadSheetPhoto } from "@/features/finanzas/actions";

/**
 * Lado mas largo de la foto que se manda al servidor. Una foto de celular
 * (4000px, 3-5 MB) se achica a ~1600px (~300-500 KB): alcanza de sobra
 * para leer la letra, entra en el limite de las Server Actions, y la IA
 * cobra por tamaño de imagen.
 */
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.85;

async function shrinkPhoto(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    // <img> respeta la orientacion EXIF (foto sacada con el celu girado),
    // asi que el canvas ya queda derecho.
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) throw new Error("toBlob");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

type UploadStatus = {
  name: string;
  state: "pending" | "working" | "done" | "error";
  sheetId?: string;
  message?: string;
};

/**
 * Subida de una o varias fotos del cuaderno (una hoja = un dia). Se
 * procesan de a una para no saturar la IA ni el servidor; cada una termina
 * como un borrador para revisar. Con una sola foto se va directo a
 * revisarla.
 */
export function SheetUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [statuses, setStatuses] = useState<UploadStatus[]>([]);
  const busy = statuses.some((s) => s.state === "pending" || s.state === "working");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const initial: UploadStatus[] = list.map((f) => ({ name: f.name, state: "pending" }));
    setStatuses(initial);
    const update = (index: number, patch: Partial<UploadStatus>) =>
      setStatuses((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

    let lastSheetId: string | null = null;
    let anyProblem = false;

    for (const [index, file] of list.entries()) {
      update(index, { state: "working" });
      try {
        const blob = await shrinkPhoto(file);
        const formData = new FormData();
        formData.append("photo", new File([blob], "hoja.jpg", { type: "image/jpeg" }));
        const result = await uploadSheetPhoto(formData);
        if (result.error || !result.sheetId) {
          anyProblem = true;
          update(index, { state: "error", message: result.error ?? "No se pudo subir." });
        } else {
          lastSheetId = result.sheetId;
          if (result.aiError) anyProblem = true;
          update(index, { state: "done", sheetId: result.sheetId, message: result.aiError ?? undefined });
        }
      } catch {
        anyProblem = true;
        update(index, { state: "error", message: "No se pudo procesar esta foto. Probá de nuevo." });
      }
    }

    if (inputRef.current) inputRef.current.value = "";
    if (list.length === 1 && lastSheetId && !anyProblem) {
      router.push(`/finanzas/planillas/${lastSheetId}`);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="gap-2">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {busy ? "Leyendo hojas..." : "Subir fotos del cuaderno"}
      </Button>

      {statuses.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-border p-3 text-sm">
          {statuses.map((status, index) => (
            <li key={index} className="flex flex-wrap items-center gap-x-2">
              <span className="font-medium">Hoja {index + 1}:</span>
              {status.state === "pending" && <span className="text-muted-foreground">en espera</span>}
              {status.state === "working" && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> leyendo con IA...
                </span>
              )}
              {status.state === "done" && status.sheetId && (
                <Link href={`/finanzas/planillas/${status.sheetId}`} className="text-primary underline-offset-4 hover:underline">
                  lista para revisar
                </Link>
              )}
              {status.state === "error" && <span className="text-destructive">error</span>}
              {status.message && (
                <span className={status.state === "error" ? "text-destructive" : "text-amber-700"}>
                  — {status.message}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
