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
  allowedDevOrigins: replitDomain ? [replitDomain] : [],
};

export default nextConfig;
