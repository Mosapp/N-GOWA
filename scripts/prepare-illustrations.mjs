// Prépare les illustrations N'GOWA pour le web (téléphones modestes compris).
//
// Usage : node scripts/prepare-illustrations.mjs <dossier-des-sources>[,<autre-dossier>]
//
// - Personnages : le fond uni (blanc ou crème) est détouré par remplissage
//   depuis les bords, puis l'image est recadrée et convertie en WebP transparent.
// - Décors et vignettes : redimensionnés et convertis en WebP.
// Les sources (JPG lourds) ne sont pas versionnées : seuls les WebP le sont.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE = process.argv[2];
if (!SOURCE) {
  console.error("Indique le dossier des images sources.");
  process.exit(1);
}
const SORTIE = "public/illustrations";

/** Préfixe du nom de fichier source → fichier de sortie. */
const PERSONNAGES = [
  ["Boy_smiling_and_waving_hello_", "mascots/kofi-salue"],
  ["Boy_pointing_enthusiastically_right_", "mascots/kofi-montre"],
  ["Boy_jumping_for_joy_", "mascots/kofi-bravo"],
  ["Boy_thinking_with_thoughtful_exp", "mascots/kofi-reflechit"],
  ["Young_girl_waving_hello_", null], // décor complet : non utilisé
  ["Child_waving_goodbye_", "mascots/awa-salue"],
  ["Girl_explaining_something_", "mascots/awa-explique"],
  ["Girl_clapping_hands_", "mascots/awa-bravo"],
  ["Girl_raising_finger_smiling_", "mascots/awa-indice"],
  // "Two_children_high-fiving_" : fond crème en dégradé, non détourable proprement.
  ["Woman_holding_basket_of_mangoes_", "persos/adjoua"],
  ["Teacher_holding_chalk_portrait_", "persos/yao"],
  ["Grandmother_holding_sewn_fabric_bag_", "persos/akissi"],
  ["Nurse_smiling_in_3D_cartoon_", "persos/bamba"],
];

const DECORS = [
  ["Cartoon_neighborhood_landscape_w", "decors/accueil", 1376],
  ["Market_stall_selling_fruit_", "decors/village-tri", 1376],
  ["River_flowing_into_lagoon_", "decors/riviere-vivante", 1376],
  ["Chimpanzee_in_tropical_forest_", "decors/foret-decouvertes", 1376],
  ["Solar_powered_neighborhood_house", "decors/royaume-energie", 1376],
  ["Baobab_tree_at_sunset_", "decors/pause", 1376],
  ["Boy_resting_against_tree_", "decors/kofi-repos", 800],
  ["Young_girl_waving_hello_", "decors/awa-au-revoir", 800],
  ["Wooden_treasure_chest_glowing_", "decors/coffre", 800],
  // Carte de l'aventure (2ᵉ lot d'images)
  ["Illustrated_adventure_map_of_reg#U2026_bbabcc45", "decors/carte-portrait", 896],
  ["Illustrated_adventure_map_with_path_71e7b0ff", "decors/carte-paysage", 1376],
  ["Sorting_trash_at_market_", "missions/marche-adjoua", 960],
  ["Children_sorting_waste_in_courtyard_", "missions/cour-ecole", 960],
  ["Seamstress_repurposing_items_in_", "missions/seconde-vie", 960],
  ["Returning_used_batteries_and_med", "missions/objets-dangereux", 960],
];

// Plusieurs dossiers sources possibles (un par lot d'images), séparés par des virgules.
const DOSSIERS = SOURCE.split(",");
const fichiers = DOSSIERS.flatMap((d) => fs.readdirSync(d).map((f) => path.join(d, f)));
const trouver = (prefixe) => {
  const f = fichiers.find((x) => path.basename(x).startsWith(prefixe));
  if (!f) throw new Error(`Image introuvable : ${prefixe}*`);
  return f;
};

/** Détoure le fond uni connecté aux bords de l'image. */
async function detourer(fichier) {
  const { data, info } = await sharp(fichier).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = (x, y) => (y * w + x) * 4;
  // Couleur de fond : moyenne des quatre coins.
  const coins = [px(2, 2), px(w - 3, 2), px(2, h - 3), px(w - 3, h - 3)];
  const fond = [0, 1, 2].map((c) => coins.reduce((s, i) => s + data[i + c], 0) / 4);
  const distance = (i) =>
    Math.sqrt((data[i] - fond[0]) ** 2 + (data[i + 1] - fond[1]) ** 2 + (data[i + 2] - fond[2]) ** 2);
  const SEUIL = 28;
  const vu = new Uint8Array(w * h);
  const pile = [];
  for (let x = 0; x < w; x += 1) pile.push(x, 0, x, h - 1);
  for (let y = 0; y < h; y += 1) pile.push(0, y, w - 1, y);
  while (pile.length) {
    const y = pile.pop();
    const x = pile.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const k = y * w + x;
    if (vu[k]) continue;
    const i = k * 4;
    const d = distance(i);
    if (d > SEUIL) continue;
    vu[k] = 1;
    // Bord progressif pour éviter le liseré blanc.
    data[i + 3] = d < SEUIL * 0.55 ? 0 : Math.round(((d - SEUIL * 0.55) / (SEUIL * 0.45)) * 255);
    pile.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
  // Seconde passe : l'ombre grise sous les pieds devient une vraie ombre
  // transparente (gris neutre et clair, reliée au fond déjà retiré).
  const ombre = [];
  for (let k = 0; k < w * h; k += 1) if (vu[k]) ombre.push(k);
  const vu2 = new Uint8Array(w * h);
  while (ombre.length) {
    const k = ombre.pop();
    const x = k % w;
    const y = (k - x) / w;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const nk = ny * w + nx;
      if (vu[nk] || vu2[nk]) continue;
      const i = nk * 4;
      const max = Math.max(data[i], data[i + 1], data[i + 2]);
      const min = Math.min(data[i], data[i + 1], data[i + 2]);
      const saturation = max === 0 ? 0 : (max - min) / max;
      if (saturation > 0.08 || max < 120) continue;
      vu2[nk] = 1;
      const opacite = Math.min(150, Math.round((fond[0] - max) * 2.2));
      data[i] = 45;
      data[i + 1] = 42;
      data[i + 2] = 38;
      data[i + 3] = Math.max(0, opacite);
      ombre.push(nk);
    }
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

fs.mkdirSync(path.join(SORTIE, "mascots"), { recursive: true });
fs.mkdirSync(path.join(SORTIE, "persos"), { recursive: true });
fs.mkdirSync(path.join(SORTIE, "decors"), { recursive: true });
fs.mkdirSync(path.join(SORTIE, "missions"), { recursive: true });

const dimensions = {};

for (const [prefixe, sortie] of PERSONNAGES) {
  if (!sortie) continue;
  // Les portraits gardent leur fond clair : ils sont affichés dans un médaillon rond.
  const portrait = sortie.startsWith("persos");
  const source = portrait ? trouver(prefixe) : await detourer(trouver(prefixe));
  const hauteur = portrait ? 360 : 640;
  const etape = portrait ? sharp(source) : sharp(source).trim({ threshold: 1 });
  const resultat = await etape
    .resize({ height: hauteur, withoutEnlargement: true })
    .webp({ quality: 80, alphaQuality: 85 })
    .toFile(path.join(SORTIE, `${sortie}.webp`));
  dimensions[sortie] = [resultat.width, resultat.height];
  console.log(`✓ ${sortie}.webp ${resultat.width}×${resultat.height} ${(resultat.size / 1024).toFixed(0)} Ko`);
}

for (const [prefixe, sortie, largeur] of DECORS) {
  const resultat = await sharp(trouver(prefixe))
    .resize({ width: largeur, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(path.join(SORTIE, `${sortie}.webp`));
  dimensions[sortie] = [resultat.width, resultat.height];
  console.log(`✓ ${sortie}.webp ${resultat.width}×${resultat.height} ${(resultat.size / 1024).toFixed(0)} Ko`);
}

// Les dimensions affichées sont à reporter dans src/content/characters.ts.
