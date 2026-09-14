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
      // Default is 1MB, too small for photo uploads (avatar up to 5MB;
      // the event gallery accepts several images per submission, each up
      // to 20MB, so the total needs real headroom above that).
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
