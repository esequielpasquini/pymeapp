import "server-only";
import * as XLSX from "xlsx";

export type ParsedRow = {
  brand: string | null;
  description: string;
  supplierName: string | null;
  pricePerKilo: number | null;
  unitPrice: number | null;
};

// Nombres de columna aceptados (case-insensitive, sin acentos), para tolerar
// pequeñas variaciones en el Excel del dueño.
const COLUMN_ALIASES: Record<string, keyof ParsedRow | "skip"> = {
  marca: "brand",
  descripcion: "description",
  "descripción": "description",
  proveedor: "supplierName",
  "precio por kilo": "pricePerKilo",
  "precio x kilo": "pricePerKilo",
  "precio kilo": "pricePerKilo",
  "precio unitario": "unitPrice",
  "precio unidad": "unitPrice",
};

function normalizeHeader(header: string): string {
  return header
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    // Colapsa cualquier corrida de espacios (incluye espacio irrompible
    //  , comun al pegar texto desde otras fuentes) a uno solo. Sin esto,
    // un encabezado como "Precio  por Kilo" (doble espacio) no matcheaba
    // ningun alias y la columna se ignoraba sin avisar.
    .replace(/[\s ]+/g, " ")
    .trim();
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export class ImportParseError extends Error {}

export function parseExcelBuffer(buffer: ArrayBuffer): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new ImportParseError("El archivo no tiene hojas.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  if (rows.length === 0) {
    throw new ImportParseError("El archivo no tiene filas de datos.");
  }

  // Mapea encabezados del archivo a nuestras claves normalizadas.
  const sampleRow = rows[0];
  const headerMap = new Map<string, keyof ParsedRow>();
  for (const header of Object.keys(sampleRow)) {
    const normalized = normalizeHeader(header);
    const mapped = COLUMN_ALIASES[normalized];
    if (mapped && mapped !== "skip") {
      headerMap.set(header, mapped);
    }
  }

  if (!Array.from(headerMap.values()).includes("description")) {
    throw new ImportParseError(
      'No se encontró la columna "Descripción". Verificá los encabezados del archivo.'
    );
  }

  const parsed: ParsedRow[] = [];
  for (const row of rows) {
    const result: ParsedRow = {
      brand: null,
      description: "",
      supplierName: null,
      pricePerKilo: null,
      unitPrice: null,
    };

    for (const [header, key] of headerMap.entries()) {
      const raw = row[header];
      if (key === "pricePerKilo" || key === "unitPrice") {
        result[key] = toNumber(raw);
      } else if (key === "description") {
        result.description = raw ? String(raw).trim() : "";
      } else if (key === "brand" || key === "supplierName") {
        result[key] = raw ? String(raw).trim() : null;
      }
    }

    if (result.description) {
      parsed.push(result);
    }
  }

  if (parsed.length === 0) {
    throw new ImportParseError("Ninguna fila tiene una descripción válida.");
  }

  return parsed;
}

/** Clave de matching entre una fila del Excel y un producto existente. */
export function matchKey(brand: string | null, description: string, supplierName: string | null): string {
  const norm = (s: string | null) =>
    (s ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  return `${norm(brand)}|${norm(description)}|${norm(supplierName)}`;
}
