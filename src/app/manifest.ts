import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "النشامى لتجارة المواشي — Al Nashamah Livestock Trading",
    short_name: "النشامى",
    start_url: "/",
    display: "standalone",
    background_color: "#F5EFE6",
    theme_color: "#0F3D32",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
