import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone", // Required for Docker deployment
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
