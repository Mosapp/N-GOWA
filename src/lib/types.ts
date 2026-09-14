import type { Palier, ThemeId } from "@/content/types";

export type LevelState = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";

export type ProfileView = {
  id: number;
  pseudo: string;
  age: number;
  avatar: string;
  langue: string;
  langueLocale: string;
  niveau: number;
  points: number;
  missionsRealisees: number;
  actionsReelles: number;
  motsAppris: number;
};

export type LevelView = {
  id: number;
  numero: number;
  themeId: ThemeId;
  themeSecondaire: ThemeId | null;
  palier: Palier;
  titre: string;
  description: string;
  statut: LevelState;
  recompense: string;
  actionHorsEcran: string;
  score: number;
  pointsGagnes: number;
  jeuScore: number;
  quizScore: number;
};

export type BadgeView = {
  id: string;
  nom: string;
  description: string;
  condition: string;
  emoji: string;
  ordre: number;
  obtenu: boolean;
};

export type ScreenTimeView = {
  date: string;
  tempsUtilise: number;
  limiteSession: number;
  limiteJour: number;
  pauses: number;
};

export type AppState = {
  profile: ProfileView;
  levels: LevelView[];
  badges: BadgeView[];
  screenTime: ScreenTimeView;
  themeHistory: ThemeId[];
  grade: { nom: string; emoji: string; min: number; max: number };
  nextGrade: { nom: string; emoji: string; min: number } | null;
};

export type CompleteLevelPayload = {
  profileId: number;
  levelId: number;
  jeuScore: number;
  jeuTotal: number;
  quizScore: number;
  quizTotal: number;
  actionFaite: boolean;
  secondes: number;
};

export type CompleteLevelResult = {
  pointsGagnes: number;
  nouveauxBadges: BadgeView[];
  niveauDebloque: number;
  progressionVersGrade: { actuel: string; suivant: string | null };
};
