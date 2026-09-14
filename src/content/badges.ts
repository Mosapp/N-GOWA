import type { BadgeContent } from "./types";

export const BADGES: BadgeContent[] = [
  {
    id: "premiere-mission",
    nom: "Premier pas",
    description: "Tu as terminé ta toute première mission N'GOWA !",
    condition: "Terminer le niveau 1",
    emoji: "🌱",
    ordre: 1,
  },
  {
    id: "petit-recycleur",
    nom: "Petit recycleur",
    description: "Tu sais où va chaque déchet de la maison.",
    condition: "Terminer 2 niveaux Déchets",
    emoji: "♻️",
    ordre: 2,
  },
  {
    id: "ami-de-l-eau",
    nom: "Ami de l'eau",
    description: "Tu protèges chaque goutte de la maison.",
    condition: "Terminer 2 niveaux Eau",
    emoji: "💧",
    ordre: 3,
  },
  {
    id: "protecteur-nature",
    nom: "Protecteur de la nature",
    description: "Tu connais les animaux et les plantes de chez toi.",
    condition: "Terminer 2 niveaux Biodiversité",
    emoji: "🦋",
    ordre: 4,
  },
  {
    id: "eco-energie",
    nom: "Éco-énergie",
    description: "Tu chasses le gaspillage dans toute la maison.",
    condition: "Terminer 2 niveaux Énergie",
    emoji: "☀️",
    ordre: 5,
  },
  {
    id: "explorateur",
    nom: "Explorateur des 4 mondes",
    description: "Tu as visité les quatre mondes de N'GOWA.",
    condition: "Terminer au moins 1 niveau de chaque monde",
    emoji: "🧭",
    ordre: 6,
  },
  {
    id: "quiz-master",
    nom: "Champion du quiz",
    description: "Un quiz parfait, sans aucune erreur !",
    condition: "Faire un quiz sans faute",
    emoji: "🏆",
    ordre: 7,
  },
  {
    id: "hero-hors-ecran",
    nom: "Héros du vrai monde",
    description: "Tu as réalisé 5 actions hors écran.",
    condition: "Réaliser 5 actions réelles",
    emoji: "🦸",
    ordre: 8,
  },
  {
    id: "eco-langues",
    nom: "Petit polyglotte",
    description: "Tu as appris 10 mots EcoLangues.",
    condition: "Découvrir 10 mots de vocabulaire",
    emoji: "🗣️",
    ordre: 9,
  },
  {
    id: "eco-ambassadeur",
    nom: "Éco-Ambassadeur",
    description: "Tu as terminé 30 missions. Tu peux maintenant en parler autour de toi !",
    condition: "Terminer 30 niveaux",
    emoji: "🌍",
    ordre: 10,
  },
];

export const AVATARS = [
  { id: "kofi", nom: "Kofi", emoji: "👦🏿", couleur: "#FF9600" },
  { id: "awa", nom: "Awa", emoji: "👧🏿", couleur: "#1CB0F6" },
  { id: "coco", nom: "Coco", emoji: "🦜", couleur: "#58CC02" },
  { id: "nia", nom: "Nia", emoji: "👩🏿", couleur: "#B45CE2" },
  { id: "elephant", nom: "Kelou", emoji: "🐘", couleur: "#7C8DA0" },
  { id: "tortue", nom: "Tawi", emoji: "🐢", couleur: "#00B5A5" },
];

export const GRADES = [
  { min: 1, max: 5, id: "novice", nom: "Novice de la Nature", emoji: "🌱" },
  { min: 6, max: 10, id: "ami", nom: "Ami de la Nature", emoji: "🌿" },
  { min: 11, max: 20, id: "gardien", nom: "Gardien de la Nature", emoji: "🛡️" },
  { min: 21, max: 30, id: "protecteur", nom: "Protecteur de la Nature", emoji: "🌳" },
  { min: 31, max: 999, id: "ambassadeur", nom: "Éco-Ambassadeur", emoji: "🌍" },
];

export function gradeForLevel(niveau: number) {
  return GRADES.find((g) => niveau >= g.min && niveau <= g.max) ?? GRADES[0];
}

export function nextGrade(niveau: number) {
  return GRADES.find((g) => g.min > niveau) ?? null;
}
