import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera un servidor autocontenido (.next/standalone) para Docker / Railway / Render.
  output: "standalone",
  // Librerías de extracción de texto que deben ejecutarse en Node, no empaquetarse.
  serverExternalPackages: ["mammoth", "unpdf"],
};

export default nextConfig;
