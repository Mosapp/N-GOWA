import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Contenus pédagogiques (sources locales, seedées au démarrage)      */
/* ------------------------------------------------------------------ */

export const themes = pgTable("themes", {
  id: text("id").primaryKey(),
  nom: text("nom").notNull(),
  categorie: text("categorie").notNull(),
  icone: text("icone").notNull(),
  couleur: text("couleur").notNull(),
  couleurClair: text("couleur_clair").notNull(),
  description: text("description").notNull(),
  miniJeu: text("mini_jeu").notNull(),
  consigneJeu: text("consigne_jeu").notNull(),
});

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),
  themeId: text("theme_id").notNull(),
  titre: text("titre").notNull(),
  contenu: text("contenu").notNull(),
  emoji: text("emoji").notNull(),
  audioFr: text("audio_fr").notNull(),
  ordre: integer("ordre").notNull(),
  palier: text("palier").notNull(),
});

export const languageContent = pgTable("language_content", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id"),
  themeId: text("theme_id").notNull(),
  motFr: text("mot_fr").notNull(),
  phraseFr: text("phrase_fr").notNull(),
  dioula: text("dioula"),
  baoule: text("baoule"),
  emoji: text("emoji").notNull(),
  statut: text("statut").notNull().default("a_valider"),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: text("id").primaryKey(),
  themeId: text("theme_id").notNull(),
  question: text("question").notNull(),
  reponses: jsonb("reponses").$type<string[]>().notNull(),
  bonneReponse: text("bonne_reponse").notNull(),
  explication: text("explication").notNull(),
  type: text("type").notNull(),
  palier: text("palier").notNull(),
});

export const badges = pgTable("badges", {
  id: text("id").primaryKey(),
  nom: text("nom").notNull(),
  description: text("description").notNull(),
  condition: text("condition").notNull(),
  emoji: text("emoji").notNull(),
  ordre: integer("ordre").notNull(),
});

/* ------------------------------------------------------------------ */
/* Profil enfant & progression globale                                */
/* ------------------------------------------------------------------ */

export const childProfiles = pgTable("child_profiles", {
  id: serial("id").primaryKey(),
  pseudo: text("pseudo").notNull(),
  age: integer("age").notNull(),
  avatar: text("avatar").notNull(),
  langue: text("langue").notNull().default("fr"),
  langueLocale: text("langue_locale").notNull().default("dioula"),
  niveau: integer("niveau").notNull().default(1),
  points: integer("points").notNull().default(0),
  missionsRealisees: integer("missions_realisees").notNull().default(0),
  actionsReelles: integer("actions_reelles").notNull().default(0),
  motsAppris: integer("mots_appris").notNull().default(0),
  dateCreation: timestamp("date_creation", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // --- Sécurité (ajouté pour le lancement public) ---
  // Identifie l'appareil (navigateur) qui a créé ce profil. Toute lecture/
  // écriture sur ce profil doit venir du même appareil (cookie signé).
  deviceId: text("device_id").notNull(),
  // Hash + sel du code PIN parental à 4 chiffres (jamais stocké en clair).
  parentPinHash: text("parent_pin_hash").notNull(), parentEmail: text("parent_email"),
  // Anti-force-brute sur le PIN : compteur d'échecs + verrou temporaire.
  pinFailedAttempts: integer("pin_failed_attempts").notNull().default(0),
  pinLockedUntil: timestamp("pin_locked_until", { withTimezone: true }),
});
export const parentPinResets = pgTable("parent_pin_resets", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const levels = pgTable(
  "levels",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id").notNull(),
    numero: integer("numero").notNull(),
    themeId: text("theme_id").notNull(),
    themeSecondaire: text("theme_secondaire"),
    palier: text("palier").notNull(),
    titre: text("titre").notNull(),
    description: text("description").notNull(),
    statut: text("statut").notNull().default("AVAILABLE"),
    recompense: text("recompense").notNull(),
    actionHorsEcran: text("action_hors_ecran").notNull(),
    dateCreation: timestamp("date_creation", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("levels_profile_numero_idx").on(table.profileId, table.numero),
  ],
);

export const levelProgress = pgTable("level_progress", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  levelId: integer("level_id").notNull(),
  statut: text("statut").notNull().default("IN_PROGRESS"),
  score: integer("score").notNull().default(0),
  pointsGagnes: integer("points_gagnes").notNull().default(0),
  jeuScore: integer("jeu_score").notNull().default(0),
  quizScore: integer("quiz_score").notNull().default(0),
  dateDebut: timestamp("date_debut", { withTimezone: true })
    .notNull()
    .defaultNow(),
  dateCompletion: timestamp("date_completion", { withTimezone: true }),
});

export const themeHistory = pgTable("theme_history", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  levelId: integer("level_id"),
  themeId: text("theme_id").notNull(),
  ordre: integer("ordre").notNull(),
});

export const userBadges = pgTable(
  "user_badges",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id").notNull(),
    badgeId: text("badge_id").notNull(),
    dateObtention: timestamp("date_obtention", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_badges_profile_badge_idx").on(
      table.profileId,
      table.badgeId,
    ),
  ],
);

export const vocabProgress = pgTable(
  "vocab_progress",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id").notNull(),
    vocabId: text("vocab_id").notNull(),
    dateDecouverte: timestamp("date_decouverte", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("vocab_progress_profile_vocab_idx").on(
      table.profileId,
      table.vocabId,
    ),
  ],
);

export const screenTime = pgTable(
  "screen_time",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id").notNull(),
    date: text("date").notNull(),
    tempsUtilise: integer("temps_utilise").notNull().default(0),
    limiteSession: integer("limite_session").notNull(),
    limiteJour: integer("limite_jour").notNull(),
    pauses: integer("pauses").notNull().default(0),
  },
  (table) => [
    uniqueIndex("screen_time_profile_date_idx").on(table.profileId, table.date),
  ],
);
