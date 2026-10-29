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

/* ------------------------------------------------------------------ */
/* Aventure N'GOWA : zones, missions, défis réels, pins               */
/* ------------------------------------------------------------------ */

/** Deux niveaux de complexité pédagogique. */
export type Complexite = "petit" | "grand";

/** Trois tranches d'âge pour le temps d'écran. */
export type TrancheAge = "4-5" | "6-8" | "9-10";

export type ZoneId = "village-tri" | "riviere-vivante" | "foret-decouvertes" | "royaume-energie";

export type ZoneContent = {
  id: ZoneId;
  nom: string;
  pilier: ThemeId;
  accroche: string;
  couleur: string;
  /** "jouable" : missions réellement disponibles ; "bientot" : zone annoncée, sans contenu. */
  disponibilite: "jouable" | "bientot";
  /** Grand décor illustré de la zone. */
  decor: string;
};

export type CompetenceId =
  | "trier-plastique"
  | "trier-papier"
  | "trier-verre"
  | "trier-restes"
  | "reperer-danger"
  | "reutiliser"
  | "economiser-eau"
  | "proteger-eau"
  | "reutiliser-eau";

export type BacId =
  | "plastique"
  | "papier"
  | "verre"
  | "restes"
  | "danger"
  | "reutiliser"
  | "trier"
  | "economise"
  | "gaspille"
  | "protege"
  | "pollue"
  | "plantes-oui"
  | "plantes-non";

export type BacContent = {
  id: BacId;
  nom: string;
  couleur: string;
  couleurFoncee: string;
  /** Pictogramme dessiné sur le bac (voir components/art/Bin). */
  picto:
    | "bouteille"
    | "feuille-papier"
    | "bocal"
    | "epluchure"
    | "main"
    | "boucle"
    | "poubelle"
    | "goutte"
    | "goutte-barree"
    | "poisson"
    | "nuage-sale"
    | "plante"
    | "plante-barree";
  /** "poubelle" pour trier des objets, "panneau" pour classer des gestes. */
  forme?: "poubelle" | "panneau";
};

export type ObjetATrier = {
  id: string;
  nom: string;
  emoji: string;
  bac: BacId;
  competence: CompetenceId;
  /** Explication courte, dite après une bonne réponse. */
  pourquoi: string;
  /** Indice bienveillant après une erreur. */
  indice: string;
  /** Objet réservé aux 6-10 ans (plus difficile). */
  grandsSeulement?: boolean;
};

export type QuestionMission = {
  question: string;
  reponses: string[];
  bonneReponse: string;
  explication: string;
};

export type MissionContent = {
  id: string;
  zoneId: ZoneId;
  ordre: number;
  titre: string;
  personnageId: string;
  /** Ce que dit le personnage au début de la mission. */
  histoire: { petit: string; grand: string };
  consigne: { petit: string; grand: string };
  /** Les trois questions de la ligne éditoriale. */
  objectif: { japprends: string; jepratique: string; pourquoi: string };
  bacs: { petit: BacId[]; grand: BacId[] };
  objets: ObjetATrier[];
  nombreObjets: { petit: number; grand: number };
  /** Question de compréhension, uniquement pour les 6-10 ans. */
  question: QuestionMission;
  defiId: string;
  /** Vignette illustrée de la mission (sinon, le décor de la zone). */
  vignette?: string;
};

export type DefiReelContent = {
  id: string;
  zoneId: ZoneId;
  titre: string;
  consigne: { petit: string; grand: string };
  pourquoi: string;
  securite: string;
  emoji: string;
};

export type PinRegle =
  | { type: "points-zone"; zoneId: ZoneId; seuil: number }
  | { type: "points-total"; seuil: number; zoneRequise: ZoneId }
  | { type: "competence"; competence: CompetenceId; missionId: string }
  | { type: "defis-valides"; nombre: number }
  | { type: "champion"; seuil: number; pinsRequis: string[] };

export type PinContent = {
  id: string;
  nom: string;
  description: string;
  /** Texte affiché tant que le pin n'est pas obtenu. */
  commentObtenir: string;
  couleur: string;
  couleurFoncee: string;
  embleme: "tri" | "boucle" | "goutte" | "feuille" | "eclair" | "etoile" | "coeur";
  regle: PinRegle;
};
