export type ThemeId = "dechets" | "eau" | "biodiversite" | "energie";

export type Palier =
  | "decouverte" // niveaux 1-5
  | "comprehension" // niveaux 6-10
  | "application" // niveaux 11-20
  | "maitrise"; // niveaux 21+

export type PalierLabel = {
  id: Palier;
  nom: string;
  verbe: string;
  description: string;
};

export type ThemeContent = {
  id: ThemeId;
  nom: string;
  categorie: string;
  icone: string;
  couleur: string;
  couleurClair: string;
  description: string;
  miniJeu: string;
  consigneJeu: string;
};

export type LessonContent = {
  id: string;
  themeId: ThemeId;
  titre: string;
  contenu: string;
  emoji: string;
  audioFr: string;
  ordre: number;
  palier: Palier;
};

export type VocabContent = {
  id: string;
  lessonId: string | null;
  themeId: ThemeId;
  motFr: string;
  phraseFr: string;
  dioula: string | null;
  baoule: string | null;
  emoji: string;
  statut: "a_valider" | "valide";
};

export type QuizContent = {
  id: string;
  themeId: ThemeId;
  question: string;
  reponses: string[];
  bonneReponse: string;
  explication: string;
  type: "choix" | "vrai_faux";
  palier: Palier;
};

export type BadgeContent = {
  id: string;
  nom: string;
  description: string;
  condition: string;
  emoji: string;
  ordre: number;
};

export type OffScreenAction = {
  themeId: ThemeId;
  palier: Palier;
  texte: string;
};
