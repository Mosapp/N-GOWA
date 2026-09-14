import {
  ACTIONS_HORS_ECRAN,
  LESSONS,
  THEME_BY_ID,
  VOCAB,
  palierFromLevel,
} from "@/content/curriculum";
import { QUIZ } from "@/content/quiz";
import {
  BINS,
  ENERGY_SPOTS,
  HABITATS,
  SPECIES,
  WASTE_ITEMS,
  WATER_SCENARIOS,
} from "@/content/games";

const BINS_LOOKUP = BINS.reduce<Record<string, (typeof BINS)[number]>>(
  (acc, b) => ({ ...acc, [b.id]: b }),
  {},
);
import type {
  LessonContent,
  Palier,
  QuizContent,
  ThemeId,
  VocabContent,
} from "@/content/types";

/* ---------------------------- aléatoire stable ---------------------------- */

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ------------------- sélection dynamique des mondes ---------------------- */

export const THEME_IDS: ThemeId[] = ["dechets", "eau", "biodiversite", "energie"];

/**
 * Randomisation contrôlée :
 * 1. jamais deux fois le même monde d'affilée ;
 * 2. favorise les mondes récemment moins utilisés ;
 * 3. empêche qu'un monde disparaisse trop longtemps ;
 * 4. garde un équilibre entre les quatre mondes.
 */
export function pickTheme(history: ThemeId[], seedKey: string): ThemeId {
  const rand = mulberry32(hashString(seedKey));
  const last = history[history.length - 1];
  const window5 = history.slice(-5);
  const window8 = history.slice(-8);

  const weights = THEME_IDS.map((id) => {
    if (id === last) return { id, poids: 0 };
    const recent = window5.filter((t) => t === id).length;
    const total = history.filter((t) => t === id).length;
    const absentFor = history.length - 1 - history.lastIndexOf(id);
    let poids = 10 - recent * 4 - total;
    if (absentFor > 4 || window8.lastIndexOf(id) === -1) poids += 8;
    if (poids < 1) poids = 1;
    return { id, poids: poids + rand() * 2 };
  });

  const total = weights.reduce((sum, w) => sum + w.poids, 0);
  let ticket = rand() * total;
  for (const w of weights) {
    ticket -= w.poids;
    if (ticket <= 0) return w.id;
  }
  const candidates = weights.filter((w) => w.id !== last && w.poids > 0);
  return candidates.length ? candidates[0].id : THEME_IDS[0];
}

/* --------------------------- intitulés de missions ------------------------ */

const MISSION_TITLES: Record<ThemeId, string[]> = {
  dechets: [
    "Le sachet perdu",
    "La poubelle mystère",
    "Le marché tout en désordre",
    "Opération rue propre",
    "La seconde vie du plastique",
    "Mission déchets dangereux",
  ],
  eau: [
    "Chaque goutte compte",
    "Le robinet oublieux",
    "La fuite de l'école",
    "La bassine maline",
    "Sauvons la lagune",
    "Le trésor de la pluie",
  ],
  biodiversite: [
    "Premier safari",
    "Le baobab géant",
    "Les œufs de la tortue",
    "Le secret de la mangrove",
    "Le bal des papillons",
    "Gardiens de la savane",
  ],
  energie: [
    "Chasse au gaspillage",
    "Bonjour le soleil",
    "La télé curieuse",
    "Le frigo bavard",
    "Le défi du ventilateur",
    "Le quartier économe",
  ],
};

const RECOMPENSES: Record<ThemeId, string[]> = {
  dechets: [
    "une poubelle jaune pour ta collection 🟡",
    "un sac de tri réutilisable 🎒",
    "un compost pour le jardin 🌱",
    "le badge du tri parfait ♻️",
    "une pelle recyclée 🧹",
    "un point de collecte dans ton quartier 🔴",
  ],
  eau: [
    "une goutte d'or 💧",
    "une bassine toute neuve 🪣",
    "un robinet magique 🚰",
    "un bidon d'eau de pluie 🌧️",
    "un poisson ami de la lagune 🐟",
    "la fontaine du village ⛲",
  ],
  biodiversite: [
    "une graine de baobab 🌳",
    "une plume de calao 🪶",
    "un papillon ami 🦋",
    "une jeune palétuvier 🌿",
    "un nid pour les oiseaux 🪹",
    "l'empreinte de l'éléphant 🐘",
  ],
  energie: [
    "une ampoule économique 💡",
    "un petit panneau solaire 🔆",
    "un ventilateur malin 🌀",
    "une lampe solaire de jardin 🏮",
    "une multiprise coupe-veille 🔌",
    "le toit solaire du quartier 🏘️",
  ],
};

export function missionTitle(themeId: ThemeId, numero: number): string {
  const list = MISSION_TITLES[themeId];
  return list[(numero - 1) % list.length];
}

/* ----------------------------- plans de niveau ---------------------------- */

export type BlueprintGame =
  | {
      id: "tri";
      consigne: string;
      bins: (typeof HABITATS)[number]["id"][] | string[];
      binsData: {
        id: string;
        nom: string;
        emoji: string;
        couleur: string;
        aide: string;
      }[];
      items: { id: string; nom: string; emoji: string; bin: string }[];
    }
  | {
      id: "eau";
      consigne: string;
      scenarios: typeof WATER_SCENARIOS;
    }
  | {
      id: "habitat";
      consigne: string;
      habitats: typeof HABITATS;
      species: typeof SPECIES;
    }
  | {
      id: "chasseur";
      consigne: string;
      spots: typeof ENERGY_SPOTS;
    };

export type LevelBlueprint = {
  numero: number;
  themeId: ThemeId;
  themeSecondaire: ThemeId | null;
  palier: Palier;
  titre: string;
  description: string;
  recompense: string;
  actionHorsEcran: string;
  lessons: LessonContent[];
  vocab: VocabContent[];
  quiz: QuizContent[];
  game: BlueprintGame;
};

const PALIER_ORDER: Palier[] = [
  "decouverte",
  "comprehension",
  "application",
  "maitrise",
];

function palierPool<T extends { palier: Palier }>(items: T[], palier: Palier) {
  const index = PALIER_ORDER.indexOf(palier);
  return items.filter((item) => PALIER_ORDER.indexOf(item.palier) <= index);
}

function pickAction(themeId: ThemeId, palier: Palier, numero: number) {
  const pool = ACTIONS_HORS_ECRAN.filter((a) => a.themeId === themeId);
  const byPalier = pool.filter((a) => a.palier === palier);
  const list = byPalier.length ? byPalier : pool;
  return list[(numero - 1) % list.length].texte;
}

/** Construit tout le contenu d'un niveau de façon déterministe. */
export function buildBlueprint(params: {
  profileId: number;
  numero: number;
  themeId: ThemeId;
  themeSecondaire?: ThemeId | null;
}): LevelBlueprint {
  const { profileId, numero, themeId } = params;
  const palier = palierFromLevel(numero);
  const theme = THEME_BY_ID[themeId];
  const rand = mulberry32(hashString(`${profileId}:${numero}:${themeId}`));

  const lessons = shuffle(
    palierPool(
      LESSONS.filter((l) => l.themeId === themeId),
      palier,
    ),
    rand,
  ).slice(0, palier === "decouverte" ? 2 : palier === "comprehension" ? 2 : 3);

  const lessonIds = new Set(lessons.map((l) => l.id));
  const attachedVocab = VOCAB.filter((v) => v.lessonId && lessonIds.has(v.lessonId));
  const otherVocab = VOCAB.filter((v) => v.themeId === themeId && !v.lessonId);
  const vocab = shuffle([...attachedVocab, ...otherVocab], rand).slice(0, 2);

  const quizPool = palierPool(
    QUIZ.filter((q) => q.themeId === themeId),
    palier,
  );
  const quiz = shuffle(quizPool, rand).slice(0, palier === "decouverte" ? 3 : 4);

  const actionHorsEcran = pickAction(themeId, palier, numero);

  let game: BlueprintGame;
  if (themeId === "dechets") {
    const bins =
      palier === "application" || palier === "maitrise"
        ? ["plastique", "papier", "verre", "organique", "special"]
        : ["plastique", "papier", "verre", "organique"];
    const binsData = bins.map((b) => {
      const found = BINS_LOOKUP[b];
      return {
        id: found.id,
        nom: found.nom,
        emoji: found.emoji,
        couleur: found.couleur,
        aide: found.aide,
      };
    });
    const pool = palierPool(WASTE_ITEMS, palier).filter((item) =>
      bins.includes(item.bin),
    );
    const count = palier === "decouverte" ? 6 : palier === "comprehension" ? 7 : 8;
    game = {
      id: "tri",
      consigne: "Touche la bonne poubelle pour chaque déchet !",
      bins,
      binsData,
      items: shuffle(pool, rand).slice(0, count),
    };
  } else if (themeId === "eau") {
    const pool = palierPool(WATER_SCENARIOS, palier);
    const count = palier === "decouverte" ? 3 : palier === "comprehension" ? 4 : 5;
    game = {
      id: "eau",
      consigne: "Choisis le bon geste avant que la bassine ne déborde !",
      scenarios: shuffle(pool, rand).slice(0, count),
    };
  } else if (themeId === "biodiversite") {
    const pool = palierPool(SPECIES, palier);
    const count = palier === "decouverte" ? 4 : palier === "comprehension" ? 5 : 6;
    const species = shuffle(pool, rand).slice(0, count);
    const habitatIds = Array.from(new Set(species.map((s) => s.habitat)));
    game = {
      id: "habitat",
      consigne: "Touche l'animal ou la plante, puis touche son habitat !",
      habitats: HABITATS.filter((h) => habitatIds.includes(h.id)),
      species,
    };
  } else {
    const wastes = shuffle(
      palierPool(ENERGY_SPOTS, palier).filter((s) => s.gaspillage),
      rand,
    );
    const goods = shuffle(
      palierPool(ENERGY_SPOTS, palier).filter((s) => !s.gaspillage),
      rand,
    );
    const wasteCount = palier === "decouverte" ? 3 : palier === "comprehension" ? 4 : 5;
    const spots = shuffle(
      [...wastes.slice(0, wasteCount), ...goods.slice(0, 3)],
      rand,
    );
    game = {
      id: "chasseur",
      consigne: "Touche tout ce qui gaspille de l'énergie !",
      spots,
    };
  }

  return {
    numero,
    themeId,
    themeSecondaire:
      palier === "maitrise"
        ? THEME_IDS[(numero + 1) % THEME_IDS.length]
        : null,
    palier,
    titre: missionTitle(themeId, numero),
    description: theme.description,
    recompense: RECOMPENSES[themeId][(numero - 1) % RECOMPENSES[themeId].length],
    actionHorsEcran,
    lessons,
    vocab,
    quiz,
    game,
  };
}



/* ------------------------------- points ---------------------------------- */

export const POINTS = {
  lecon: 10,
  vocabulaire: 10,
  jeu: 5, // par réussite
  quiz: 10, // par bonne réponse
  bonusSansFaute: 15,
  actionReelle: 5,
};

export function scoreQuiz(correct: number, total: number) {
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
  return pct;
}

/* ------------------------------- badges ----------------------------------- */

export type BadgeContext = {
  missionsRealisees: number;
  actionsReelles: number;
  motsAppris: number;
  completedByTheme: Record<ThemeId, number>;
  quizParfait: boolean;
};

export function evaluateBadges(ctx: BadgeContext): string[] {
  const earned: string[] = [];
  if (ctx.missionsRealisees >= 1) earned.push("premiere-mission");
  if ((ctx.completedByTheme.dechets ?? 0) >= 2) earned.push("petit-recycleur");
  if ((ctx.completedByTheme.eau ?? 0) >= 2) earned.push("ami-de-l-eau");
  if ((ctx.completedByTheme.biodiversite ?? 0) >= 2)
    earned.push("protecteur-nature");
  if ((ctx.completedByTheme.energie ?? 0) >= 2) earned.push("eco-energie");
  if (
    (ctx.completedByTheme.dechets ?? 0) >= 1 &&
    (ctx.completedByTheme.eau ?? 0) >= 1 &&
    (ctx.completedByTheme.biodiversite ?? 0) >= 1 &&
    (ctx.completedByTheme.energie ?? 0) >= 1
  )
    earned.push("explorateur");
  if (ctx.quizParfait) earned.push("quiz-master");
  if (ctx.actionsReelles >= 5) earned.push("hero-hors-ecran");
  if (ctx.motsAppris >= 10) earned.push("eco-langues");
  if (ctx.missionsRealisees >= 30) earned.push("eco-ambassadeur");
  return earned;
}

/* --------------------------- temps d'écran -------------------------------- */

export type ScreenLimits = {
  sessionMinutes: number;
  pauseMinutes: number;
  jourMinutes: number;
};

export function screenLimitsForAge(age: number): ScreenLimits {
  if (age <= 5) return { sessionMinutes: 15, pauseMinutes: 10, jourMinutes: 30 };
  if (age <= 8) return { sessionMinutes: 20, pauseMinutes: 10, jourMinutes: 40 };
  return { sessionMinutes: 30, pauseMinutes: 10, jourMinutes: 60 };
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
