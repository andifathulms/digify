import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dipakai stage prod di Dockerfile: bundle mandiri, image kecil.
  output: "standalone",
  reactStrictMode: true,
};

export default nextConfig;
