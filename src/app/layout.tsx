import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Reemplaza la tipografia de sistema por defecto: mejor legibilidad de
// numeros (precios) y una descripcion de producto con mas caracter que el
// font-sans generico del navegador, sin perder velocidad de lectura en la
// tablet del mostrador. Se expone como variable CSS y se enchufa como
// font-sans por defecto en tailwind.config.ts, asi que aplica a toda la app,
// no solo al listado de productos.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Asistente de Precios",
  description: "Encontrá y actualizá precios rápido, sin vueltas.",
  // manifest.webmanifest (display: "standalone") es lo que le permite a
  // Chrome en Android abrir la app sin la barra de direcciones ni los
  // controles del navegador cuando se agrega a la pantalla de inicio (menu
  // de 3 puntos > "Agregar a pantalla de inicio" / "Instalar app"). No hace
  // falta un service worker para esto -- eso solo es necesario si se quiere
  // funcionamiento offline, que a proposito NO se implementa aca: cachear
  // datos serviria precios viejos a un empleado atendiendo a un cliente.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Asistente de Precios",
  },
};

// Sin esto, el celular/tablet renderiza la pagina asumiendo un viewport de
// escritorio (~980px) y despues la escala para que entre en pantalla -- por
// eso se ve todo achicado/agrandado de forma rara y hay que hacer zoom a
// mano. Con esto el layout usa el ancho real del dispositivo desde el vamos.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2463eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={plusJakartaSans.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
