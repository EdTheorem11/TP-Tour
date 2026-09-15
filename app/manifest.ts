import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TP Tour",
    short_name: "TP Tour",
    description: "The UAE's leading golf society for professionals across Finance, Crypto, Digital Assets and FinTech.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0E0D",
    theme_color: "#0A0E0D",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
