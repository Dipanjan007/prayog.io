import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prayog: Play with physics",
    short_name: "Prayog",
    description: "NCERT Physics for Classes 7 to 10, learned through live simulations.",
    start_url: "/learn",
    display: "standalone",
    background_color: "#070a14",
    theme_color: "#070a14",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
