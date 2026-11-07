/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Fotos del cuaderno de ventas (modulo Finanzas): el navegador las achica
    // a ~1600px antes de mandarlas, pero se deja margen sobre el 1 MB default.
    serverActions: { bodySizeLimit: "5mb" },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
