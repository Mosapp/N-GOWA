import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "N'GOWA — Apprendre. Jouer. Comprendre. Agir.",
    short_name: "N'GOWA",
    description: "Aventure éducative écologique pour les enfants de 4 à 10 ans.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Téléphone, tablette et PC : l'app suit l'orientation de l'écran.
    orientation: "any",
    background_color: "#FFF6E6",
    theme_color: "#237A44",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
