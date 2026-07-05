import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asistente de Precios",
  description: "Encontrá y actualizá precios rápido, sin vueltas.",
};

// Sin esto, el celular/tablet renderiza la pagina asumiendo un viewport de
// escritorio (~980px) y despues la escala para que entre en pantalla -- por
// eso se ve todo achicado/agrandado de forma rara y hay que hacer zoom a
// mano. Con esto el layout usa el ancho real del dispositivo desde el vamos.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
