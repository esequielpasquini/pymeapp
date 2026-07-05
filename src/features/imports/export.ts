import "server-only";
import * as XLSX from "xlsx";

// Encabezados iguales a los que entiende parse.ts (ver COLUMN_ALIASES), asi
// el archivo que se descarga aca se puede volver a subir sin problemas.
export type CatalogRow = {
  Marca: string;
  Descripcion: string;
  Proveedor: string;
  Categoria: string;
  Tags: string;
  "Precio por kilo": number | "";
  "Precio unitario": number | "";
};

/**
 * Arma el .xlsx del catalogo actual (tal cual esta en la base, con
 * cualquier edicion manual ya reflejada). Pensado para la funcionalidad
 * "Recrear Excel": el dueño lo descarga y lo usa como base para su proxima
 * planilla de modificaciones, en vez de reusar un Excel viejo que pisaria
 * precios editados a mano despues de la ultima importacion.
 */
export function buildCatalogWorkbook(rows: CatalogRow[]): Buffer {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Catalogo");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
