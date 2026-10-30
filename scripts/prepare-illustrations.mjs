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
  // Vignettes des missions Rivière, Forêt et Énergie (3ᵉ lot d'images)
  ["Washing_dishes_in_family_home_", "missions/chaque-goutte", 960],
  ["Woman_washing_laundry_by_lagoon_", "missions/riviere-propre", 960],
  ["Backyard_garden_after_rain_", "missions/tresor-de-l-eau", 960],
  ["Animals_in_diverse_habitats_", "missions/qui-vit-ou", 960],
  ["Bird_nest_and_planted_tree_", "missions/amis-nature", 960],
  ["Beach_and_mangrove_habitat_cleaning_", "missions/maison-propre", 960],
  ["Living_room_with_laundry_drying_", "missions/chasse-gaspillage", 960],
  ["Neighborhood_with_renewable_ener", "missions/soleil-ami", 960],
  ["Safe_home_electrical_practices_", "missions/electricite-sans-danger", 960],
  // Avatars au choix (4ᵉ lot d'images) : portraits carrés, affichés en rond.
  ["Boy_smiling_in_football_jersey_", "avatars/moussa", 320],
  ["Girl_smiling_in_yellow_dress_", "avatars/fatou", 320],
  ["Boy_smiling_portrait_", "avatars/yann", 320],
  ["Child_smiling_in_portrait_", "avatars/aicha", 320],
  ["Young_boy_smiling_", "avatars/kouame", 320],
  ["Girl_smiling_in_purple_dress_", "avatars/ama", 320],
  ["Baby_elephant_smiling_portrait_", "avatars/elephant", 320],
  ["Smiling_turtle_looking_forward_", "avatars/tortue", 320],
  ["Hornbill_bird_smiling_portrait_", "avatars/calao", 320],
  ["Butterfly_smiling_", "avatars/papillon", 320],
  ["Baby_chimpanzee_smiling_portrait_", "avatars/chimpanze", 320],
  ["Pygmy_hippo_smiling_", "avatars/hippo", 320],
  // Décors « propres » des scènes de ramassage (5ᵉ lot d'images)
  ["Vendors_at_open-air_market_", "scenes/marche-adjoua", 896],
  ["Children_playing_in_school_court#U2026_dda9117e", "scenes/cour-ecole", 896],
  ["Sewing_workshop_courtyard_with_f#U2026_ceb951a4", "scenes/seconde-vie", 896],
  ["Courtyard_of_Ivorian_house_4e8597bf", "scenes/objets-dangereux", 896],
  // Décors des jeux de la Rivière, de la Forêt et de l'Énergie (7ᵉ lot)
  ["River_flowing_through_contrastin#U2026_52fcffba", "scenes/riviere", 896],
  ["Ivorian_landscape_divided_into_a#U2026_739e690d", "scenes/habitats", 896],
  ["Split_forest_landscape_showing_c#U2026_9d34d6db", "scenes/nature", 896],
  ["Village_at_dusk_from_hill_42c22190", "scenes/village-nuit", 896],
];

// Planches d'objets sur fond blanc (3 colonnes par défaut) : chaque case
// devient un objet détouré, dans l'ordre de lecture. null = case vide.
const PLANCHES = [
  ["Garbage_items_arranged_in_grid_7b08945d", [
    "sachet-eau", "bouteille-plastique", "sac-marche",
    "carton", "journal", "peau-banane",
    "epluchures-igname", "peau-mangue", "gobelet",
  ]],
  ["Objects_arranged_in_3x3_grid_8f786022", [
    "bouteille-verre", "pot-miel", "feuille-dessin",
    "cahier-fini", "emballage-biscuit", "sachet-eau-ecole",
    "peau-orange", "reste-riz", "coco",
  ]],
  ["Household_objects_grid_on_white_fa7c70bf", [
    "bocal", "pagne", "carton-jouets",
    "cahier-moitie", "bidon", "sachet-dechire",
    "peau-banane-sv", "journal-mouille", "gobelet-casse",
  ]],
  ["Objects_arranged_in_3x3_grid_e9cb9d31", [
    "pile", "medicaments", "ampoule-cassee",
    "telephone-casse", "bouteille-danger", "epluchures-danger",
    "feuilles-marche", "enveloppe", null,
  ]],
  ["People_using_water_conservation_#U2026_8f3c19a0", [
    "robinet-ferme-dents", "gobelet-dents", "robinet-ouvert",
    "douche-courte", "jouer-tuyau", "vaisselle-bassine",
    "fuite-ignoree", "voiture-seau", "cour-tuyau",
  ]],
  ["People_managing_waste_and_enviro#U2026_b74d3d92", [
    "sachet-caniveau", "dechet-poubelle", "huile-lagune",
    "linge-bassine", "piles-eau", "ramasser-adulte",
    "peinture-caniveau", "proteger-mangrove", null,
  ]],
  ["Water_dioramas_game_asset_sheet_fb1b5e49", [
    "eau-pluie", "rincage-legumes", "eau-riz",
    "eau-huile", "eau-javel", "eau-salee",
    "eau-bouilloire", "eau-peinture", null,
  ]],
  ["Cute_friendly_animals_asset_sheet_7cc87727", [
    "chimpanze", "elephant", "crocodile", "tortue",
    "perroquet-gris", "buffle", "poisson", "hippo-nain",
    "antilope", "papillon", "abeille", "margouillat",
  ], { colonnes: 4 }],
  ["Children_in_nature_dioramas_2304dee8", [
    "observer-oiseau", "arracher-fleurs", "planter-arbre",
    "pierres-oiseaux", "laisser-nid", "graver-arbre",
    "arroser-plante", "attraper-papillon", null,
  ]],
  ["Dioramas_depicting_environmental#U2026_a31ee112", [
    "plage-sachets", "vieil-arbre", "feu-brousse",
    "mare-propre", "filet-abandonne", "mangrove-protegee",
    "musique-forte", "jardin-fleurs", null,
  ]],
  ["Children_demonstrating_energy_co#U2026_ddfe7c62", [
    "lampe-jour", "eteindre-sortant", "tele-seule",
    "linge-soleil", "frigo-ouvert", "ventilo-vide",
    "fenetre-air", "clim-fenetre", null,
  ], { carte: true }],
  ["Energy_sources_game_asset_sheet_f598e993", [
    "panneau-solaire", "lampe-solaire", "groupe-electrogene",
    "voiture-essence", "barrage", "eolienne",
    "lampe-petrole", "chauffe-eau-solaire", null,
  ], { carte: true, marge: 0.1 }],
  ["Children_demonstrating_electrica#U2026_7af564ed", [
    "interrupteur", "doigts-prise", "mains-mouillees",
    "demander-adulte", "fil-tombe", "cerf-volant",
    "telecommande", "tirer-fil", null,
  ], { carte: true }],
];

// Poubelles en deux pièces (corps à gauche, couvercle à droite) : le
// couvercle est animé séparément pour s'ouvrir puis se refermer.
const POUBELLES = [
  ["Recycling_bin_parts_side_by_f275919d", "plastique"],
  ["Recycling_bin_parts_side_by_10e01fee", "papier"],
  ["Recycling_bin_parts_side_by_3fd86835", "verre"],
  ["Compost_bin_and_lid_parts_8d9e0a8f", "restes"],
  ["Red_safety_box_components_8bd5d8c2", "danger"],
  ["Purple_wooden_storage_chest_parts_8d26b1a5", "reutiliser", 0.28],
  // Poubelle grise : seule l'ombre très claire part, pas le gris du corps.
  ["Sorting_bin_and_lid_parts_93fc75f2", "trier", 0.16, 185],
];

// Autres pièces en deux morceaux (gauche, droite) pour le jeu de l'Énergie.
const DEUX_PIECES = [
  ["Toy_lever_switch_parts_8012e921", "jeux/levier-socle", "jeux/levier-manche"],
  ["Empty_battery_and_energy_liquid_f4e75ceb", "jeux/batterie", "jeux/batterie-energie"],
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

/** Dilate (ou érode) un masque binaire avec un carré de rayon r. */
function morpho(masque, w, h, r, dilater) {
  const passe = (src, horizontal) => {
    const dst = new Uint8Array(w * h);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        let v = dilater ? 0 : 1;
        for (let d = -r; d <= r && v === (dilater ? 0 : 1); d += 1) {
          const nx = horizontal ? x + d : x;
          const ny = horizontal ? y : y + d;
          const dedans = nx >= 0 && ny >= 0 && nx < w && ny < h;
          const m = dedans ? src[ny * w + nx] : 0;
          if (dilater ? m : !m) v = dilater ? 1 : 0;
        }
        dst[y * w + x] = v;
      }
    }
    return dst;
  };
  return passe(passe(masque, true), false);
}

/**
 * Détoure un objet d'une planche sur fond blanc : on ferme les petites
 * ouvertures du contour, on remplit les trous (plastique, papier clair…),
 * puis l'ombre grise posée sur le blanc devient une ombre transparente.
 */
async function detourerObjet(entree, { sansOmbre = false, saturation = 0.16, clarte = 110 } = {}) {
  const { data, info } = await sharp(entree).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const n = w * h;
  const blancheur = (k) => 255 - Math.min(data[k * 4], data[k * 4 + 1], data[k * 4 + 2]);
  const visible = new Uint8Array(n);
  for (let k = 0; k < n; k += 1) visible[k] = blancheur(k) > 14 ? 1 : 0;
  const ferme = morpho(visible, w, h, 3, true);
  // Fond = ce qui est relié au bord sans traverser l'objet fermé.
  const fond = new Uint8Array(n);
  const pile = [];
  for (let x = 0; x < w; x += 1) pile.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y += 1) pile.push(y * w, y * w + w - 1);
  while (pile.length) {
    const k = pile.pop();
    if (fond[k] || ferme[k]) continue;
    fond[k] = 1;
    const x = k % w;
    if (x > 0) pile.push(k - 1);
    if (x < w - 1) pile.push(k + 1);
    if (k >= w) pile.push(k - w);
    if (k < n - w) pile.push(k + w);
  }
  const plein = new Uint8Array(n);
  for (let k = 0; k < n; k += 1) plein[k] = fond[k] ? 0 : 1;
  const objet = morpho(plein, w, h, 4, false);
  // Ombre : pixels gris clairs, peu saturés, à moins de 22 px du fond.
  const profondeur = new Int16Array(n).fill(-1);
  const file = [];
  for (let k = 0; k < n; k += 1) if (!objet[k]) { profondeur[k] = 0; file.push(k); }
  for (let t = 0; t < file.length; t += 1) {
    const k = file[t];
    const x = k % w;
    for (const v of [x > 0 ? k - 1 : -1, x < w - 1 ? k + 1 : -1, k - w, k + w]) {
      if (v < 0 || v >= n || profondeur[v] !== -1) continue;
      const i = v * 4;
      const max = Math.max(data[i], data[i + 1], data[i + 2]);
      const min = Math.min(data[i], data[i + 1], data[i + 2]);
      const gris = sansOmbre
        ? max > 0 && (max - min) / max < saturation && max >= clarte
        : max > 0 && (max - min) / max < 0.07 && max >= 165;
      if (!gris || (!sansOmbre && profondeur[k] >= 22)) continue;
      profondeur[v] = profondeur[k] + 1;
      file.push(v);
    }
  }
  for (let k = 0; k < n; k += 1) {
    const i = k * 4;
    if (!objet[k]) data[i + 3] = 0;
    else if (profondeur[k] > 0 && sansOmbre) data[i + 3] = 0;
    else if (profondeur[k] > 0) {
      const opacite = Math.min(130, Math.round((255 - Math.max(data[i], data[i + 1], data[i + 2])) * 2.4));
      data[i] = 45;
      data[i + 1] = 38;
      data[i + 2] = 30;
      data[i + 3] = opacite;
    }
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

/**
 * Garde la pièce principale d'une case détourée : les morceaux qui touchent
 * le bord et sont petits viennent de la case voisine.
 */
async function garderPrincipal(entree) {
  const { data, info } = await sharp(entree).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const n = w * h;
  const groupe = new Int32Array(n).fill(-1);
  const tailles = [];
  const auBord = [];
  for (let k0 = 0; k0 < n; k0 += 1) {
    if (groupe[k0] !== -1 || data[k0 * 4 + 3] < 40) continue;
    const g = tailles.length;
    let taille = 0;
    let bord = false;
    const pile = [k0];
    groupe[k0] = g;
    while (pile.length) {
      const k = pile.pop();
      taille += 1;
      const x = k % w;
      const y = (k - x) / w;
      if (x < 8 || y < 8 || x >= w - 8 || y >= h - 8) bord = true;
      for (const v of [x > 0 ? k - 1 : -1, x < w - 1 ? k + 1 : -1, y > 0 ? k - w : -1, y < h - 1 ? k + w : -1]) {
        if (v < 0 || groupe[v] !== -1 || data[v * 4 + 3] < 40) continue;
        groupe[v] = g;
        pile.push(v);
      }
    }
    tailles.push(taille);
    auBord.push(bord);
  }
  const max = Math.max(...tailles);
  for (let k = 0; k < n; k += 1) {
    const g = groupe[k];
    if (g >= 0 && auBord[g] && tailles[g] < max * 0.3) data[k * 4 + 3] = 0;
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

/** Carte illustrée à cadre blanc : on garde l'image intérieure (le cadre est redessiné en CSS). */
async function interieurCarte(entree, marge) {
  const { data, info } = await sharp(entree).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  // Le fond blanc, le cadre crème et l'ombre grise sont clairs et peu
  // colorés : on les remplit depuis les bords, l'image est ce qui reste.
  const clair = (k) => {
    const i = k * 3;
    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    return max >= 196 && (max - min) / max < 0.18;
  };
  const vu = new Uint8Array(w * h);
  const pile = [];
  for (let x = 0; x < w; x += 1) pile.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y += 1) pile.push(y * w, y * w + w - 1);
  while (pile.length) {
    const k = pile.pop();
    if (vu[k] || !clair(k)) continue;
    vu[k] = 1;
    const x = k % w;
    if (x > 0) pile.push(k - 1);
    if (x < w - 1) pile.push(k + 1);
    if (k >= w) pile.push(k - w);
    if (k < w * h - w) pile.push(k + w);
  }
  // Boîte des lignes et colonnes majoritairement « image ».
  const ligne = (y) => { let c = 0; for (let x = 0; x < w; x += 1) if (!vu[y * w + x]) c += 1; return c; };
  const colonne = (x) => { let c = 0; for (let y = 0; y < h; y += 1) if (!vu[y * w + x]) c += 1; return c; };
  const ys = [...Array(h).keys()].filter((y) => ligne(y) > w * 0.4);
  const xs = [...Array(w).keys()].filter((x) => colonne(x) > h * 0.4);
  // Petite marge en plus : le bord intérieur du cadre est souvent ombré.
  const [lx, ly] = [xs.at(-1) - xs[0], ys.at(-1) - ys[0]];
  const [mx, my] = [Math.round(lx * marge) + 2, Math.round(ly * marge) + 2];
  const zone = { left: xs[0] + mx, top: ys[0] + my, width: lx - 2 * mx, height: ly - 2 * my };
  return sharp(entree).extract(zone).png().toBuffer();
}

fs.mkdirSync(path.join(SORTIE, "mascots"), { recursive: true });
fs.mkdirSync(path.join(SORTIE, "persos"), { recursive: true });
fs.mkdirSync(path.join(SORTIE, "decors"), { recursive: true });
fs.mkdirSync(path.join(SORTIE, "missions"), { recursive: true });
fs.mkdirSync(path.join(SORTIE, "avatars"), { recursive: true });
fs.mkdirSync(path.join(SORTIE, "scenes"), { recursive: true });
fs.mkdirSync(path.join(SORTIE, "objets"), { recursive: true });
fs.mkdirSync(path.join(SORTIE, "poubelles"), { recursive: true });

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

for (const [prefixe, ids, { colonnes = 3, carte = false, marge = 0.035 } = {}] of PLANCHES) {
  const source = trouver(prefixe);
  const { width, height } = await sharp(source).metadata();
  const rangees = Math.ceil(ids.length / colonnes);
  const cw = Math.floor(width / colonnes);
  const ch = Math.floor(height / rangees);
  for (const [n, id] of ids.entries()) {
    if (!id) continue;
    const zone = { left: (n % colonnes) * cw, top: Math.floor(n / colonnes) * ch, width: cw, height: ch };
    const caseImage = await sharp(source).extract(zone).png().toBuffer();
    const resultat = await sharp(carte ? await interieurCarte(caseImage, marge) : await garderPrincipal(await detourerObjet(caseImage)))
      .trim({ threshold: 1 })
      .resize({ width: 240, height: 240, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, alphaQuality: 90 })
      .toFile(path.join(SORTIE, `objets/${id}.webp`));
    console.log(`✓ objets/${id}.webp ${resultat.width}×${resultat.height} ${(resultat.size / 1024).toFixed(0)} Ko`);
  }
}

/**
 * Sépare une image détourée en deux pièces (gauche, droite) là où il y a le
 * moins de matière, puis les enregistre à la même échelle (pièce de gauche
 * large de `largeur` px). Renvoie les dimensions des deux fichiers.
 */
async function deuxPieces(detoure, largeur, [sortieGauche, sortieDroite]) {
  const { data, info } = await sharp(detoure).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  // Colonne la moins remplie entre les deux pièces (un reflet coloré au sol
  // peut les relier : on coupe là où il y a le moins de matière).
  const remplissage = (x) => {
    let n = 0;
    for (let y = 0; y < h; y += 1) if (data[(y * w + x) * 4 + 3] > 150) n += 1;
    return n;
  };
  let meilleur = null;
  for (let x = Math.floor(w * 0.3), debut = -1, min = Infinity; x < w * 0.75; x += 1) {
    const n = remplissage(x);
    if (n < min) {
      min = n;
      debut = x;
      meilleur = [x, x];
    } else if (n === min && debut >= 0 && meilleur[1] === x - 1) meilleur[1] = x;
  }
  const coupe = Math.round((meilleur[0] + meilleur[1]) / 2);
  const gauche = await sharp(detoure).extract({ left: 0, top: 0, width: coupe, height: h }).png().toBuffer();
  const droite = await sharp(detoure).extract({ left: coupe, top: 0, width: w - coupe, height: h }).png().toBuffer();
  // Rogne sur l'opacité forte pour que l'ombre ne fausse pas l'alignement.
  const cadre = async (buf) => {
    const { data: d, info: i } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
    let [x0, y0, x1, y1] = [i.width, i.height, 0, 0];
    for (let y = 0; y < i.height; y += 1)
      for (let x = 0; x < i.width; x += 1)
        if (d[(y * i.width + x) * 4 + 3] > 200) {
          x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
        }
    return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  };
  const cg = await cadre(gauche);
  const cd = await cadre(droite);
  const echelle = largeur / cg.width;
  const sauver = async (buf, zone, sortie) => {
    const r = await sharp(buf)
      .extract(zone)
      .resize({ width: Math.round(zone.width * echelle) })
      .webp({ quality: 84, alphaQuality: 90 })
      .toFile(path.join(SORTIE, `${sortie}.webp`));
    return [r.width, r.height];
  };
  return [await sauver(gauche, cg, sortieGauche), await sauver(droite, cd, sortieDroite)];
}

// Poubelles : corps à gauche, couvercle à droite, à la même échelle.
for (const [prefixe, id, saturation = 0.16, clarte = 110] of POUBELLES) {
  const detoure = await detourerObjet(trouver(prefixe), { sansOmbre: true, saturation, clarte });
  const [corps, couvercle] = await deuxPieces(detoure, 260, [`poubelles/${id}-corps`, `poubelles/${id}-couvercle`]);
  console.log(`✓ poubelles/${id} corps ${corps.join("×")} couvercle ${couvercle.join("×")}`);
}

fs.mkdirSync(path.join(SORTIE, "jeux"), { recursive: true });
for (const [prefixe, sortieGauche, sortieDroite] of DEUX_PIECES) {
  // Détourage prudent : le verre de la batterie est presque blanc.
  const detoure = await detourerObjet(trouver(prefixe));
  const [g, d] = await deuxPieces(detoure, 240, [sortieGauche, sortieDroite]);
  console.log(`✓ ${sortieGauche} ${g.join("×")} + ${sortieDroite} ${d.join("×")}`);
}

// Avatars de Kofi et Awa : visage recadré depuis leur pose « salue », sur
// un fond pastel comme les autres portraits.
const VISAGES = [
  ["kofi", { left: 80, top: 0, width: 260, height: 260 }, "#FCD9BD"],
  ["awa", { left: 25, top: 10, width: 280, height: 280 }, "#E4D6F5"],
];
for (const [id, zone, fond] of VISAGES) {
  const visage = await sharp(path.join(SORTIE, `mascots/${id}-salue.webp`)).extract(zone).resize(320, 320).toBuffer();
  const resultat = await sharp({ create: { width: 320, height: 320, channels: 3, background: fond } })
    .composite([{ input: visage }])
    .webp({ quality: 80 })
    .toFile(path.join(SORTIE, `avatars/${id}.webp`));
  console.log(`✓ avatars/${id}.webp ${(resultat.size / 1024).toFixed(0)} Ko`);
}

// Les dimensions affichées sont à reporter dans src/content/characters.ts.
