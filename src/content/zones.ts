import type { ZoneContent, ZoneId } from "./types";

/**
 * Les quatre zones de la carte d'aventure.
 * Seul le Village du Tri est jouable dans le MVP : les autres zones sont
 * affichées comme « bientôt », sans mission simulée.
 */
export const ZONES: ZoneContent[] = [
  {
    id: "village-tri",
    decor: "/illustrations/decors/village-tri.webp",
    nom: "Le Village du Tri",
    pilier: "dechets",
    accroche: "Trier, réduire et donner une seconde vie aux objets.",
    couleur: "#B4532A",
    disponibilite: "jouable",
  },
  {
    id: "riviere-vivante",
    decor: "/illustrations/decors/riviere-vivante.webp",
    nom: "La Rivière Vivante",
    pilier: "eau",
    accroche: "Garder l'eau propre et ne pas la gaspiller.",
    couleur: "#1A6FA8",
    disponibilite: "bientot",
  },
  {
    id: "foret-decouvertes",
    decor: "/illustrations/decors/foret-decouvertes.webp",
    nom: "La Forêt des Découvertes",
    pilier: "biodiversite",
    accroche: "Rencontrer les plantes et les animaux de chez nous.",
    couleur: "#237A44",
    disponibilite: "bientot",
  },
  {
    id: "royaume-energie",
    decor: "/illustrations/decors/royaume-energie.webp",
    nom: "Le Royaume de l'Énergie",
    pilier: "energie",
    accroche: "Économiser l'électricité avec l'aide du soleil.",
    couleur: "#C98A0E",
    disponibilite: "bientot",
  },
];

export const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z])) as Record<
  ZoneId,
  ZoneContent
>;
