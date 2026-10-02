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
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}
