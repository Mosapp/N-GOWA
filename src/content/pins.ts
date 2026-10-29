import type { PinContent } from "./types";

/**
 * Pins écologiques, inspirés des badges scouts.
 *
 * Les seuils sont CONFIGURABLES ici et devront être équilibrés après des
 * tests avec des enfants. Les seuils du cahier des charges (200 / 400 / 600 /
 * 800 / 1000) servent de base ; « Gardien de l'Eau » et « Ami de la Nature »
 * demandent 150 points dans leur zone, qui compte 3 missions (contre 4 au
 * Village), pour rester atteignables par les 4-5 ans.
 *
 * Un pin de pilier demande aussi d'avoir joué dans la zone correspondante :
 * on ne peut pas devenir « Gardien de l'Eau » en ne triant que des déchets.
 */
export const PINS: PinContent[] = [
  {
    id: "eco-tri",
    nom: "Éco-Tri",
    description: "Tu sais trier les déchets du quotidien.",
    commentObtenir: "Gagne 200 points dans le Village du Tri.",
    couleur: "#F6B427",
    couleurFoncee: "#B37A0A",
    embleme: "tri",
    regle: { type: "points-zone", zoneId: "village-tri", seuil: 200 },
  },
  {
    id: "seconde-vie",
    nom: "Seconde Vie",
    description: "Tu sais donner une nouvelle utilité aux objets.",
    commentObtenir: "Montre que tu sais réutiliser dans « La seconde vie des objets ».",
    couleur: "#7A4BC0",
    couleurFoncee: "#4E2C86",
    embleme: "boucle",
    regle: { type: "competence", competence: "reutiliser", missionId: "seconde-vie" },
  },
  {
    id: "heros-vrai-monde",
    nom: "Héros du Vrai Monde",
    description: "Un adulte a validé un de tes gestes dans la vraie vie.",
    commentObtenir: "Fais valider un défi du vrai monde par un adulte.",
    couleur: "#C9432C",
    couleurFoncee: "#8C2B1B",
    embleme: "coeur",
    regle: { type: "defis-valides", nombre: 1 },
  },
  {
    id: "gardien-eau",
    nom: "Gardien de l'Eau",
    description: "Tu sais éviter le gaspillage d'eau.",
    commentObtenir: "Gagne 150 points dans la Rivière Vivante.",
    couleur: "#1A6FA8",
    couleurFoncee: "#0F4670",
    embleme: "goutte",
    regle: { type: "points-zone", zoneId: "riviere-vivante", seuil: 150 },
  },
  {
    id: "ami-nature",
    nom: "Ami de la Nature",
    description: "Tu protèges les plantes et les animaux.",
    commentObtenir: "Gagne 150 points dans la Forêt des Découvertes.",
    couleur: "#237A44",
    couleurFoncee: "#134D29",
    embleme: "feuille",
    regle: { type: "points-zone", zoneId: "foret-decouvertes", seuil: 150 },
  },
  {
    id: "energie-maligne",
    nom: "Énergie Maligne",
    description: "Tu adoptes des gestes qui économisent l'énergie.",
    commentObtenir: "800 points et des missions dans le Royaume de l'Énergie (bientôt).",
    couleur: "#E0762E",
    couleurFoncee: "#9C4A12",
    embleme: "eclair",
    regle: { type: "points-total", seuil: 800, zoneRequise: "royaume-energie" },
  },
  {
    id: "champion-ngowa",
    nom: "Champion N'GOWA",
    description: "Tu progresses dans tous les domaines de l'écologie.",
    commentObtenir: "1 000 points et les pins des quatre zones.",
    couleur: "#2D2A26",
    couleurFoncee: "#000000",
    embleme: "etoile",
    regle: {
      type: "champion",
      seuil: 1000,
      pinsRequis: ["eco-tri", "gardien-eau", "ami-nature", "energie-maligne"],
    },
  },
];

export const PIN_BY_ID = Object.fromEntries(PINS.map((p) => [p.id, p])) as Record<
  string,
  PinContent
>;
