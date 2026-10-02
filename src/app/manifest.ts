import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aanmigam",
    short_name: "Aanmigam",
    description: "Daily spiritual card experience.",
    start_url: "/ta",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6B2E5B",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
