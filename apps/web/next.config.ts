import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@whitemerce/shared"],
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
