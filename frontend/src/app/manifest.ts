import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Monpang - Монголын онлайн дэлгүүр",
    short_name: "Monpang",
    description:
      "Монголын хамгийн том онлайн худалдааны платформ. Чанартай бараа, хурдан хүргэлт, найдвартай үйлчилгээ.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#020617",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["shopping", "lifestyle"],
    lang: "mn",
    dir: "ltr",
  };
}
