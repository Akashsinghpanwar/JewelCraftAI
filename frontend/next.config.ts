import type { NextConfig } from "next";

const replitDomain = process.env.REPLIT_DEV_DOMAIN;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  allowedDevOrigins: [
    ...(replitDomain ? [replitDomain, `https://${replitDomain}`] : []),
    "127.0.0.1",
    "localhost",
  ],
  experimental: {
    proxyTimeout: 300000, // 5 minutes timeout for API proxy
  },
};

export default nextConfig;
