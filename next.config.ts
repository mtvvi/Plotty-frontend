import type { NextConfig } from "next";

const imageRemotePatterns = [
  {
    protocol: "https" as const,
    hostname: "s3.plotty-stories.duckdns.org",
  },
  {
    protocol: "https" as const,
    hostname: "api.plotty-stories.duckdns.org",
  },
  ...(process.env.NODE_ENV === "production"
    ? []
    : [
        {
          protocol: "http" as const,
          hostname: "localhost",
        },
        {
          protocol: "http" as const,
          hostname: "127.0.0.1",
        },
      ]),
];
const defaultBackendUrl =
  process.env.NODE_ENV === "production" ? "https://api.plotty-stories.duckdns.org/api" : "http://localhost:8080/api";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: imageRemotePatterns,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? defaultBackendUrl;

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
