// Génère les icônes PWA à partir de l'emblème N'GOWA (soleil + feuille).
// Usage : node scripts/generate-icons.mjs
import sharp from "sharp";

const embleme = (fond, marge) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="512" height="512">
  <rect width="64" height="64" ${fond ? "" : 'rx="18"'} fill="#237A44"/>
  <g transform="translate(32 32) scale(${1 - marge}) translate(-32 -32)">
    <circle cx="42" cy="22" r="11" fill="#F6B427"/>
    <path d="M14 50 C 12 30, 26 18, 44 20 C 44 38, 32 50, 14 50 Z" fill="#FFFFFF"/>
    <path d="M14 50 L 34 30" stroke="#237A44" stroke-width="3.5" stroke-linecap="round"/>
  </g>
</svg>`;

const sorties = [
  { fichier: "public/icons/icon-192.png", taille: 192, svg: embleme(false, 0) },
  { fichier: "public/icons/icon-512.png", taille: 512, svg: embleme(false, 0) },
  { fichier: "public/icons/apple-touch-icon.png", taille: 180, svg: embleme(true, 0.1) },
  { fichier: "public/icons/icon-maskable-512.png", taille: 512, svg: embleme(true, 0.28) },
];

for (const s of sorties) {
  await sharp(Buffer.from(s.svg)).resize(s.taille, s.taille).png().toFile(s.fichier);
  console.log("✓", s.fichier);
}
