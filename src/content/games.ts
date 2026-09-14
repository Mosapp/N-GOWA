import type { ThemeId } from "./types";

/* ------------------------------------------------------------------ */
/* MONDE 1 — Déchets : « À quelle poubelle ? »                        */
/* ------------------------------------------------------------------ */

export type BinId = "plastique" | "papier" | "verre" | "organique" | "special";

export const BINS: {
  id: BinId;
  nom: string;
  emoji: string;
  couleur: string;
  aide: string;
}[] = [
  {
    id: "plastique",
    nom: "Plastique",
    emoji: "🟡",
    couleur: "#FFC800",
    aide: "Sachets, bouteilles, emballages",
  },
  {
    id: "papier",
    nom: "Papier",
    emoji: "🔵",
    couleur: "#1CB0F6",
    aide: "Cahiers, cartons, journaux",
  },
  {
    id: "verre",
    nom: "Verre",
    emoji: "🟢",
    couleur: "#58CC02",
    aide: "Bouteilles et pots en verre",
  },
  {
    id: "organique",
    nom: "Organique",
    emoji: "🟤",
    couleur: "#A9713A",
    aide: "Épluchures, restes, feuilles",
  },
  {
    id: "special",
    nom: "Dangereux",
    emoji: "🔴",
    couleur: "#FF4B4B",
    aide: "Piles, médicaments, électronique",
  },
];

export type WasteItem = {
  id: string;
  nom: string;
  emoji: string;
  bin: BinId;
  palier: "decouverte" | "comprehension" | "application" | "maitrise";
};

export const WASTE_ITEMS: WasteItem[] = [
  { id: "w1", nom: "Sachet d'eau", emoji: "🥤", bin: "plastique", palier: "decouverte" },
  { id: "w2", nom: "Bouteille en plastique", emoji: "🧴", bin: "plastique", palier: "decouverte" },
  { id: "w3", nom: "Emballage de biscuit", emoji: "🍪", bin: "plastique", palier: "decouverte" },
  { id: "w4", nom: "Vieux cahier", emoji: "📒", bin: "papier", palier: "decouverte" },
  { id: "w5", nom: "Carton de tomates", emoji: "📦", bin: "papier", palier: "decouverte" },
  { id: "w6", nom: "Épluchures d'igname", emoji: "🍠", bin: "organique", palier: "decouverte" },
  { id: "w7", nom: "Peau de mangue", emoji: "🥭", bin: "organique", palier: "decouverte" },
  { id: "w8", nom: "Feuilles du marché", emoji: "🌿", bin: "organique", palier: "comprehension" },
  { id: "w9", nom: "Bouteille de verre", emoji: "🍾", bin: "verre", palier: "decouverte" },
  { id: "w10", nom: "Pot de confiture", emoji: "🍯", bin: "verre", palier: "comprehension" },
  { id: "w11", nom: "Journal du jour", emoji: "📰", bin: "papier", palier: "comprehension" },
  { id: "w12", nom: "Gobelet en plastique", emoji: "🥛", bin: "plastique", palier: "comprehension" },
  { id: "w13", nom: "Reste de riz", emoji: "🍚", bin: "organique", palier: "comprehension" },
  { id: "w14", nom: "Pile usée", emoji: "🔋", bin: "special", palier: "application" },
  { id: "w15", nom: "Téléphone cassé", emoji: "📱", bin: "special", palier: "application" },
  { id: "w16", nom: "Médicament périmé", emoji: "💊", bin: "special", palier: "maitrise" },
  { id: "w17", nom: "Boîte de sardine", emoji: "🥫", bin: "special", palier: "maitrise" },
  { id: "w18", nom: "Sachet de riz vide", emoji: "🌾", bin: "plastique", palier: "application" },
];

/* ------------------------------------------------------------------ */
/* MONDE 2 — Eau : « Sauve l'eau ! »                                   */
/* ------------------------------------------------------------------ */

export type WaterScenario = {
  id: string;
  lieu: string;
  situation: string;
  emoji: string;
  options: { texte: string; correct: boolean; retour: string }[];
  palier: WasteItem["palier"];
};

export const WATER_SCENARIOS: WaterScenario[] = [
  {
    id: "e1",
    lieu: "À la maison",
    situation: "Le robinet de la cuisine coule et personne ne l'utilise.",
    emoji: "🚰",
    palier: "decouverte",
    options: [
      { texte: "Je ferme le robinet", correct: true, retour: "Bravo ! Aucune goutte perdue." },
      { texte: "Je le laisse couler", correct: false, retour: "L'eau se perd pendant que personne ne l'utilise." },
      { texte: "Je mets un seau dessous", correct: false, retour: "Le seau débordera. Mieux vaut fermer !" },
    ],
  },
  {
    id: "e2",
    lieu: "Devant la maison",
    situation: "Une flaque se forme sous un tuyau : c'est une fuite.",
    emoji: "💧",
    palier: "decouverte",
    options: [
      { texte: "Je préviens un adulte", correct: true, retour: "Oui ! Une fuite réparée, c'est une bassine sauvée." },
      { texte: "Je joue dans la flaque", correct: false, retour: "L'eau continue de se perdre." },
      { texte: "Je mets du sable dessus", correct: false, retour: "On cache l'eau, on ne répare pas la fuite." },
    ],
  },
  {
    id: "e3",
    lieu: "Salle de bain",
    situation: "Tu te brosses les dents avec le robinet ouvert.",
    emoji: "🪥",
    palier: "decouverte",
    options: [
      { texte: "Je ferme le robinet en me brossant", correct: true, retour: "Parfait ! Tu sauves beaucoup d'eau." },
      { texte: "Je laisse couler, c'est plus simple", correct: false, retour: "Des dizaines de litres partent au caniveau." },
      { texte: "Je chante sous l'eau", correct: false, retour: "Amusant, mais l'eau coule toujours !" },
    ],
  },
  {
    id: "e4",
    lieu: "La cour",
    situation: "On lave la cour avec un tuyau d'eau ouvert à fond.",
    emoji: "🧹",
    palier: "comprehension",
    options: [
      { texte: "On utilise un seau et une serpillière", correct: true, retour: "Exact : la cour est propre avec beaucoup moins d'eau." },
      { texte: "On arrose toute la rue", correct: false, retour: "Beaucoup d'eau perdue pour rien." },
      { texte: "On ne nettoie plus jamais", correct: false, retour: "Nettoyer est utile, mais avec la bonne quantité d'eau." },
    ],
  },
  {
    id: "e5",
    lieu: "Au marché",
    situation: "Des sachets flottent dans le caniveau qui mène à la lagune.",
    emoji: "🌊",
    palier: "comprehension",
    options: [
      { texte: "On les ramasse et on les trie", correct: true, retour: "Oui ! Tu protèges l'eau et les poissons." },
      { texte: "On les pousse plus loin", correct: false, retour: "Ils finiront quand même dans la lagune." },
      { texte: "Ce n'est pas mon affaire", correct: false, retour: "L'eau du quartier, c'est l'affaire de tous." },
    ],
  },
  {
    id: "e6",
    lieu: "Le jardin",
    situation: "Il a beaucoup plu cette nuit.",
    emoji: "🌧️",
    palier: "application",
    options: [
      { texte: "Je récupère l'eau de pluie dans un bidon", correct: true, retour: "Excellent ! De l'eau gratuite pour le jardin." },
      { texte: "J'arrose quand même avec le robinet", correct: false, retour: "La terre est déjà mouillée, inutile de puiser." },
      { texte: "Je laisse tout s'écouler", correct: false, retour: "Dommage, cette eau pouvait servir." },
    ],
  },
  {
    id: "e7",
    lieu: "La lagune",
    situation: "Un voisin veut jeter son huile de friture dans la lagune.",
    emoji: "🐟",
    palier: "application",
    options: [
      { texte: "Je lui explique que ça pollue l'eau", correct: true, retour: "Bravo ! Expliquer, c'est agir." },
      { texte: "Je regarde sans rien dire", correct: false, retour: "L'huile va empêcher les poissons de respirer." },
      { texte: "J'en jette aussi", correct: false, retour: "Ce serait deux fois plus de pollution." },
    ],
  },
  {
    id: "e8",
    lieu: "Le puits du quartier",
    situation: "Les enfants lavent leurs chaussures directement au puits.",
    emoji: "🏺",
    palier: "maitrise",
    options: [
      { texte: "On utilise une bassine loin du puits", correct: true, retour: "Oui ! On garde l'eau du puits propre pour boire." },
      { texte: "On savonne dans le puits", correct: false, retour: "Le savon pollue l'eau que tout le monde boit." },
      { texte: "On laisse faire", correct: false, retour: "Le puits du quartier doit rester propre." },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* MONDE 3 — Biodiversité : « Qui vit où ? »                           */
/* ------------------------------------------------------------------ */

export type HabitatId = "savane" | "foret" | "lagune" | "ocean" | "mangrove" | "jardin";

export const HABITATS: {
  id: HabitatId;
  nom: string;
  emoji: string;
  couleur: string;
}[] = [
  { id: "savane", nom: "Savane", emoji: "🌾", couleur: "#FFC800" },
  { id: "foret", nom: "Forêt", emoji: "🌲", couleur: "#22A06B" },
  { id: "lagune", nom: "Lagune", emoji: "🏞️", couleur: "#1CB0F6" },
  { id: "ocean", nom: "Plage & océan", emoji: "🏖️", couleur: "#00B5A5" },
  { id: "mangrove", nom: "Mangrove", emoji: "🌿", couleur: "#0F8B6C" },
  { id: "jardin", nom: "Jardin", emoji: "🌺", couleur: "#FF7BA9" },
];

export type SpeciesItem = {
  id: string;
  nom: string;
  emoji: string;
  habitat: HabitatId;
  astuce: string;
  palier: WasteItem["palier"];
};

export const SPECIES: SpeciesItem[] = [
  { id: "s1", nom: "Éléphant", emoji: "🐘", habitat: "savane", astuce: "Il parcourt la savane et sème des graines.", palier: "decouverte" },
  { id: "s2", nom: "Chimpanzé", emoji: "🐒", habitat: "foret", astuce: "Il dort dans les grands arbres.", palier: "decouverte" },
  { id: "s3", nom: "Tortue marine", emoji: "🐢", habitat: "ocean", astuce: "Elle pond ses œufs dans le sable.", palier: "decouverte" },
  { id: "s4", nom: "Papillon", emoji: "🦋", habitat: "jardin", astuce: "Il butine les fleurs et porte le pollen.", palier: "decouverte" },
  { id: "s5", nom: "Baobab", emoji: "🌳", habitat: "savane", astuce: "Il stocke l'eau dans son tronc.", palier: "decouverte" },
  { id: "s6", nom: "Crocodile", emoji: "🐊", habitat: "lagune", astuce: "Il chasse caché dans l'eau douce.", palier: "comprehension" },
  { id: "s7", nom: "Palétuvier", emoji: "🌱", habitat: "mangrove", astuce: "Ses racines protègent la côte.", palier: "comprehension" },
  { id: "s8", nom: "Héron", emoji: "🦩", habitat: "lagune", astuce: "Il pêche les petits poissons.", palier: "comprehension" },
  { id: "s9", nom: "Calao", emoji: "🦅", habitat: "foret", astuce: "Il niche dans les trous des arbres.", palier: "comprehension" },
  { id: "s10", nom: "Mangouste", emoji: "🦡", habitat: "savane", astuce: "Elle chasse les insectes et les rongeurs.", palier: "application" },
  { id: "s11", nom: "Bananier", emoji: "🍌", habitat: "jardin", astuce: "Il aime l'ombre et beaucoup d'eau.", palier: "application" },
  { id: "s12", nom: "Crabe de palétuvre", emoji: "🦀", habitat: "mangrove", astuce: "Il nettoie la vase de la mangrove.", palier: "application" },
  { id: "s13", nom: "Perroquet", emoji: "🦜", habitat: "foret", astuce: "Comme Coco, il vit dans la forêt.", palier: "application" },
  { id: "s14", nom: "Dauphin", emoji: "🐬", habitat: "ocean", astuce: "Il chasse en groupe près de la côte.", palier: "maitrise" },
  { id: "s15", nom: "Chauve-souris", emoji: "🦇", habitat: "foret", astuce: "La nuit, elle pollinise les fleurs.", palier: "maitrise" },
  { id: "s16", nom: "Iguane des rochers", emoji: "🦎", habitat: "savane", astuce: "Il se chauffe au soleil sur les pierres.", palier: "maitrise" },
];

/* ------------------------------------------------------------------ */
/* MONDE 4 — Énergie : « Chasseur de gaspillage »                      */
/* ------------------------------------------------------------------ */

export type EnergySpot = {
  id: string;
  nom: string;
  emoji: string;
  gaspillage: boolean;
  retour: string;
  palier: WasteItem["palier"];
};

export const ENERGY_SPOTS: EnergySpot[] = [
  { id: "g1", nom: "Lampe allumée en plein jour", emoji: "💡", gaspillage: true, retour: "Le soleil éclaire déjà la pièce !", palier: "decouverte" },
  { id: "g2", nom: "Télé allumée sans personne", emoji: "📺", gaspillage: true, retour: "Personne ne regarde : on éteint !", palier: "decouverte" },
  { id: "g3", nom: "Ventilateur dans une pièce vide", emoji: "🌀", gaspillage: true, retour: "Il brasse l'air pour personne.", palier: "decouverte" },
  { id: "g4", nom: "Panneau solaire sur le toit", emoji: "🔆", gaspillage: false, retour: "Ça, c'est une bonne chose ! Le soleil travaille pour nous.", palier: "decouverte" },
  { id: "g5", nom: "Frigo grand ouvert", emoji: "🧊", gaspillage: true, retour: "Il perd son froid et consomme plus.", palier: "comprehension" },
  { id: "g6", nom: "Chargeur branché sans téléphone", emoji: "🔌", gaspillage: true, retour: "Un chargeur seul consomme encore un peu d'énergie.", palier: "comprehension" },
  { id: "g7", nom: "Lampe solaire du jardin", emoji: "🏮", gaspillage: false, retour: "Elle fonctionne avec le soleil, parfait !", palier: "comprehension" },
  { id: "g8", nom: "Fenêtre ouverte + climatisation", emoji: "🪟", gaspillage: true, retour: "Le froid s'échappe par la fenêtre.", palier: "comprehension" },
  { id: "g9", nom: "Lampes éteintes en sortant", emoji: "🚪", gaspillage: false, retour: "Excellente habitude d'éco-héros !", palier: "comprehension" },
  { id: "g10", nom: "Multiprise avec 6 appareils en veille", emoji: "🔋", gaspillage: true, retour: "On coupe la multiprise et tout s'arrête.", palier: "application" },
  { id: "g11", nom: "Fer à repasser oublié", emoji: "👕", gaspillage: true, retour: "Dangereux et très gourmand en énergie !", palier: "application" },
  { id: "g12", nom: "Séchage du linge au soleil", emoji: "🧺", gaspillage: false, retour: "Le soleil sèche gratuitement. Bravo !", palier: "application" },
  { id: "g13", nom: "Congélateur plein de glace", emoji: "❄️", gaspillage: true, retour: "La couche de givre force le moteur à travailler plus.", palier: "maitrise" },
  { id: "g14", nom: "Ampoules économiques dans la maison", emoji: "🔋", gaspillage: false, retour: "Elles éclairent autant en consommant moins.", palier: "maitrise" },
  { id: "g15", nom: "Ordinateur allumé toute la nuit", emoji: "💻", gaspillage: true, retour: "Il tourne pour rien et chauffe la pièce.", palier: "maitrise" },
];

export const GAME_META: Record<ThemeId, { id: string; nom: string; consigne: string }> = {
  dechets: { id: "tri", nom: "À quelle poubelle ?", consigne: "Touche la bonne poubelle pour chaque déchet !" },
  eau: { id: "eau", nom: "Sauve l'eau !", consigne: "Choisis le bon geste avant que la bassine ne déborde !" },
  biodiversite: { id: "habitat", nom: "Qui vit où ?", consigne: "Touche l'animal, puis son habitat !" },
  energie: { id: "chasseur", nom: "Chasseur de gaspillage", consigne: "Touche tout ce qui gaspille de l'énergie !" },
};
