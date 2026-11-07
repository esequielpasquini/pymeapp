import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod/v4";

/**
 * Lectura de la foto de una hoja del cuaderno de ventas con Claude (vision).
 * Devuelve una PROPUESTA: el dueño la revisa y corrige en pantalla antes de
 * confirmar, nunca se guarda como definitiva sin esa revision.
 *
 * Modelo: Claude Haiku 5.5 -- elegido por el dueño por costo (centavos de
 * dolar por mes con una foto por dia). Si la precision no alcanza, cambiar
 * SHEET_READER_MODEL a "claude-opus-5-5" (mas preciso, ~US$0,07 por foto).
 */
const SHEET_READER_MODEL = "claude-haiku-5-5";

const SheetSchema = z.object({
  day: z.number().nullable().describe("Dia del mes escrito en el encabezado, o null si no se lee."),
  month: z.number().nullable().describe("Mes (1-12) escrito en el encabezado, o null si no se lee."),
  opening_cash: z
    .number()
    .nullable()
    .describe("Monto de 'Inicio' (plata en la caja al abrir), en pesos, o null si no figura."),
  entries: z.array(
    z.object({
      amount: z.number().describe("Monto de la venta en pesos, como numero entero (13.000 -> 13000)."),
      enclosed: z
        .boolean()
        .describe("true si el monto esta encerrado en un recuadro, rectangulo redondeado, circulo u ovalo."),
      uncertain: z
        .boolean()
        .describe("true si el numero es dificil de leer y conviene que una persona lo revise."),
    })
  ),
});

export type SheetReading = z.infer<typeof SheetSchema>;

const INSTRUCTIONS = `Esta es la foto de una hoja de un cuaderno donde los empleados de un comercio de Argentina anotan a mano las ventas de un dia.

Cómo está escrita la hoja:
- Arriba está el encabezado con el día de la semana y la fecha (dd/mm o dd/mm/aa). Devolvé solo el día y el mes; el año escrito suele estar mal, ignoralo.
- Debajo dice "Inicio $X": es la plata que había en la caja al abrir. NO es una venta: va en opening_cash, nunca en entries.
- El resto de los números son ventas, una por número, en pesos. Están en 2 o 3 columnas. Leelas columna por columna, de izquierda a derecha, y dentro de cada columna de arriba hacia abajo.
- El punto es separador de miles: "13.000" son 13000 pesos, "1.400" son 1400. A veces escriben sin punto ("4300"). Todos los montos son enteros.
- Un punto, guion o coma DESPUÉS del número es una marca de control, no parte del monto: "5300." son 5300.
- Si un monto está encerrado (recuadro, rectángulo, rectángulo redondeado, círculo u óvalo), es una transferencia: enclosed = true. Si no está encerrado es efectivo: enclosed = false. Las líneas horizontales debajo de un grupo de números no cuentan como encierro.
- Ignorá cualquier palabra o anotación al lado de los números (por ejemplo "Comp", "Uh", "x"): no son montos.
- Ignorá los garabatos, tachones y rayas cruzadas que haya encima de la hoja, y leé igual los números que quedan debajo si se distinguen.
- Si un número fue escrito encima de otro, tomá el que quedó escrito al final.
- Omití solo los números que estén completamente tapados o ilegibles. Si dudás entre dos lecturas, elegí la más probable y marcá uncertain = true.
- No inventes montos ni sumes: devolvé exactamente las ventas anotadas.`;

export class SheetReaderNotConfiguredError extends Error {
  constructor() {
    super("Falta configurar ANTHROPIC_API_KEY.");
  }
}

export async function readSheetPhoto(imageBase64: string, mediaType: "image/jpeg" | "image/png" | "image/webp") {
  if (!process.env.ANTHROPIC_API_KEY) throw new SheetReaderNotConfiguredError();

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: SHEET_READER_MODEL,
    max_tokens: 16000,
    output_config: {
      effort: "medium",
      format: zodOutputFormat(SheetSchema),
    },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          { type: "text", text: INSTRUCTIONS },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("La IA no pudo procesar esta foto.");
  }
  if (response.stop_reason === "max_tokens" || !response.parsed_output) {
    throw new Error("La IA no devolvió una lectura válida de la hoja.");
  }

  return { reading: cleanReading(response.parsed_output), usage: response.usage };
}

/** Descarta montos no positivos y redondea dia, mes y montos a enteros. */
export function cleanReading(reading: SheetReading): SheetReading {
  const wholeOrNull = (value: number | null) => (value === null || !Number.isFinite(value) ? null : Math.round(value));
  return {
    ...reading,
    day: wholeOrNull(reading.day),
    month: wholeOrNull(reading.month),
    opening_cash: reading.opening_cash && reading.opening_cash > 0 ? Math.round(reading.opening_cash) : null,
    entries: reading.entries
      .map((entry) => ({ ...entry, amount: Math.round(entry.amount) }))
      .filter((entry) => Number.isFinite(entry.amount) && entry.amount > 0),
  };
}
