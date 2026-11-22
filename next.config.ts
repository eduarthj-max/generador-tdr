import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Librerías de extracción de texto que deben ejecutarse en Node, no empaquetarse.
  serverExternalPackages: ["mammoth", "unpdf"],
};

export default nextConfig;
