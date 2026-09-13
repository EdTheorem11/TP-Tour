import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    serverActions: {
      // Default is 1MB, too small for photo uploads (avatar up to 5MB,
      // and the event gallery accepts several images per submission).
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
