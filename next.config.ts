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
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https://s3.plotty-stories.duckdns.org https://api.plotty-stories.duckdns.org",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self' https://api.plotty-stories.duckdns.org",
].join("; ");
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Referrer-Policy",
    value: "no-referrer",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
];

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
