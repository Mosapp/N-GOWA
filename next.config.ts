import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Empêche l'app d'être affichée dans une <iframe> sur un autre
          // site (protection contre le "clickjacking").
          { key: "X-Frame-Options", value: "DENY" },
          // Empêche le navigateur de "deviner" un type de fichier différent
          // de celui déclaré (protection contre certaines attaques XSS).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Limite les informations envoyées aux sites externes quand un
          // enfant clique sur un lien sortant.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Désactive l'accès à la caméra/micro/géolocalisation par défaut :
          // cette app n'en a pas besoin.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
