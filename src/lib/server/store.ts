import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  badges as badgesTable,
  childProfiles,
  parentPinResets,
  languageContent,
  lessons as lessonsTable,
  levelProgress,
  levels as levelsTable,
  quizQuestions,
  screenTime as screenTimeTable,
  themes as themesTable,
  themeHistory,
  userBadges,
  vocabProgress,
} from "@/db/schema";
import { BADGES, gradeForLevel, nextGrade } from "@/content/badges";
import { LESSONS, THEMES, VOCAB } from "@/content/curriculum";
import { QUIZ } from "@/content/quiz";
import {
  buildBlueprint,
  evaluateBadges,
  pickTheme,
  POINTS,
  screenLimitsForAge,
  todayKey,
} from "@/lib/ngowa";
import { isLocked, onFailedAttempt, verifyPin } from "@/lib/server/pin";
import type {
  AppState,
  BadgeView,
  CompleteLevelPayload,
  CompleteLevelResult,
  LevelView,
  ProfileView,
} from "@/lib/types";
import type { ThemeId } from "@/content/types";

/* ------------------------------ seed contenus ----------------------------- */

let seedPromise: Promise<void> | null = null;

export function ensureSeed(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      await db.insert(themesTable).values(THEMES).onConflictDoNothing();
      await db.insert(lessonsTable).values(LESSONS).onConflictDoNothing();
      await db.insert(languageContent).values(VOCAB).onConflictDoNothing();
      await db.insert(quizQuestions).values(QUIZ).onConflictDoNothing();
      await db.insert(badgesTable).values(BADGES).onConflictDoNothing();
    })().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

/* ------------------------------- utilitaires ------------------------------ */

async function themeHistoryFor(profileId: number): Promise<ThemeId[]> {
  const rows = await db
    .select({ themeId: themeHistory.themeId })
    .from(themeHistory)
    .where(eq(themeHistory.profileId, profileId))
    .orderBy(asc(themeHistory.ordre));
  return rows.map((row) => row.themeId as ThemeId);
}

async function generateLevel(
  profileId: number,
  numero: number,
  statut: "AVAILABLE" | "LOCKED",
): Promise<void> {
  const history = await themeHistoryFor(profileId);
  const seedKey = `${profileId}-${numero}`;
  const themeId = pickTheme(history, seedKey);
  const blueprint = buildBlueprint({ profileId, numero, themeId });

  const inserted = await db
    .insert(levelsTable)
    .values({
      profileId,
      numero,
      themeId: blueprint.themeId,
      themeSecondaire: blueprint.themeSecondaire,
      palier: blueprint.palier,
      titre: blueprint.titre,
      description: blueprint.description,
      statut,
      recompense: blueprint.recompense,
      actionHorsEcran: blueprint.actionHorsEcran,
    })
    .onConflictDoNothing()
    .returning({ id: levelsTable.id });

  if (!inserted.length) return;

  await db.insert(themeHistory).values({
    profileId,
    levelId: inserted[0].id,
    themeId: blueprint.themeId,
    ordre: numero,
  });

  if (statut === "AVAILABLE") {
    await db
      .insert(levelProgress)
      .values({
        profileId,
        levelId: inserted[0].id,
        statut: "IN_PROGRESS",
      })
      .onConflictDoNothing();
  }
}

async function ensureLevelsAhead(profileId: number, niveau: number) {
  for (let numero = niveau; numero <= niveau + 2; numero += 1) {
    const existing = await db
      .select({ id: levelsTable.id })
      .from(levelsTable)
      .where(
        and(
          eq(levelsTable.profileId, profileId),
          eq(levelsTable.numero, numero),
        ),
      );
    if (!existing.length) {
      await generateLevel(profileId, numero, numero === niveau ? "AVAILABLE" : "LOCKED");
    }
  }
}

/* --------------------------------- état ----------------------------------- */

export async function getState(profileId: number): Promise<AppState | null> {
  await ensureSeed();
  const [profile] = await db
    .select()
    .from(childProfiles)
    .where(eq(childProfiles.id, profileId));
  if (!profile) return null;

  await ensureLevelsAhead(profile.id, profile.niveau);

  const levelRows = await db
    .select({
      id: levelsTable.id,
      numero: levelsTable.numero,
      themeId: levelsTable.themeId,
      themeSecondaire: levelsTable.themeSecondaire,
      palier: levelsTable.palier,
      titre: levelsTable.titre,
      description: levelsTable.description,
      statut: levelsTable.statut,
      recompense: levelsTable.recompense,
      actionHorsEcran: levelsTable.actionHorsEcran,
    })
    .from(levelsTable)
    .where(eq(levelsTable.profileId, profile.id))
    .orderBy(asc(levelsTable.numero));

  const progressRows = await db
    .select()
    .from(levelProgress)
    .where(eq(levelProgress.profileId, profile.id));
  const progressByLevel = new Map(progressRows.map((p) => [p.levelId, p]));

  const levelViews: LevelView[] = levelRows.map((row) => {
    const progress = progressByLevel.get(row.id);
    const statut: LevelView["statut"] =
      row.numero < profile.niveau
        ? "COMPLETED"
        : row.numero === profile.niveau
          ? "IN_PROGRESS"
          : "LOCKED";
    return {
      id: row.id,
      numero: row.numero,
      themeId: row.themeId as ThemeId,
      themeSecondaire: (row.themeSecondaire as ThemeId | null) ?? null,
      palier: row.palier as LevelView["palier"],
      titre: row.titre,
      description: row.description,
      statut,
      recompense: row.recompense,
      actionHorsEcran: row.actionHorsEcran,
      score: progress?.score ?? 0,
      pointsGagnes: progress?.pointsGagnes ?? 0,
      jeuScore: progress?.jeuScore ?? 0,
      quizScore: progress?.quizScore ?? 0,
    };
  });

  const earnedRows = await db
    .select({ badgeId: userBadges.badgeId })
    .from(userBadges)
    .where(eq(userBadges.profileId, profile.id));
  const earned = new Set(earnedRows.map((r) => r.badgeId));

  const badgeViews: BadgeView[] = BADGES.map((badge) => ({
    id: badge.id,
    nom: badge.nom,
    description: badge.description,
    condition: badge.condition,
    emoji: badge.emoji,
    ordre: badge.ordre,
    obtenu: earned.has(badge.id),
  }));

  const today = todayKey();
  const limits = screenLimitsForAge(profile.age);
  const [existingTime] = await db
    .select()
    .from(screenTimeTable)
    .where(
      and(eq(screenTimeTable.profileId, profile.id), eq(screenTimeTable.date, today)),
    );
  const screenTimeView = existingTime
    ? {
      date: existingTime.date,
      tempsUtilise: existingTime.tempsUtilise,
      limiteSession: existingTime.limiteSession,
      limiteJour: existingTime.limiteJour,
      pauses: existingTime.pauses,
    }
    : {
      date: today,
      tempsUtilise: 0,
      limiteSession: limits.sessionMinutes * 60,
      limiteJour: limits.jourMinutes * 60,
      pauses: 0,
    };

  const grade = gradeForLevel(profile.niveau);
  const next = nextGrade(profile.niveau);

  return {
    profile: {
      id: profile.id,
      pseudo: profile.pseudo,
      age: profile.age,
      avatar: profile.avatar,
      langue: profile.langue,
      langueLocale: profile.langueLocale,
      niveau: profile.niveau,
      points: profile.points,
      missionsRealisees: profile.missionsRealisees,
      actionsReelles: profile.actionsReelles,
      motsAppris: profile.motsAppris,
    },
    levels: levelViews,
    badges: badgeViews,
    screenTime: screenTimeView,
    themeHistory: await themeHistoryFor(profile.id),
    grade: { nom: grade.nom, emoji: grade.emoji, min: grade.min, max: grade.max },
    nextGrade: next ? { nom: next.nom, emoji: next.emoji, min: next.min } : null,
  };
}

/* -------------------------------- profil ---------------------------------- */

export async function createProfile(input: {
  pseudo: string;
  age: number;
  avatar: string;
  langue?: string;
  langueLocale?: string;
  deviceId: string;
  parentPinHash: string;
  parentEmail: string;
}): Promise<ProfileView> {
  await ensureSeed();
  const [profile] = await db
    .insert(childProfiles)
    .values({
      pseudo: input.pseudo,
      age: input.age,
      avatar: input.avatar,
      langue: input.langue ?? "fr",
      langueLocale: input.langueLocale ?? "dioula",
      deviceId: input.deviceId,
      parentPinHash: input.parentPinHash,
      parentEmail: input.parentEmail,
    })
    .returning();

  const limits = screenLimitsForAge(profile.age);
  const today = todayKey();
  await db.insert(screenTimeTable).values({
    profileId: profile.id,
    date: today,
    limiteSession: limits.sessionMinutes * 60,
    limiteJour: limits.jourMinutes * 60,
  });

  await generateLevel(profile.id, 1, "AVAILABLE");
  await ensureLevelsAhead(profile.id, 1);

  return {
    id: profile.id,
    pseudo: profile.pseudo,
    age: profile.age,
    avatar: profile.avatar,
    langue: profile.langue,
    langueLocale: profile.langueLocale,
    niveau: profile.niveau,
    points: profile.points,
    missionsRealisees: profile.missionsRealisees,
    actionsReelles: profile.actionsReelles,
    motsAppris: profile.motsAppris,
  };
}

/**
 * Vérifie que le profil appartient bien à l'appareil qui fait la requête.
 * Retourne false si le profil n'existe pas OU s'il appartient à un autre
 * appareil (dans les deux cas, l'appelant ne doit voir aucune différence,
 * pour ne pas révéler l'existence d'un profileId à un tiers).
 */
export async function isOwnedByDevice(
  profileId: number,
  deviceId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ deviceId: childProfiles.deviceId })
    .from(childProfiles)
    .where(eq(childProfiles.id, profileId));
  return Boolean(row) && row.deviceId === deviceId;
}

export type PinCheckResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "locked" | "wrong_pin" };

/**
 * Vérifie le PIN parental pour une action sensible (ex: suppression du
 * profil), avec verrouillage temporaire après plusieurs échecs.
 */
export async function checkParentPin(
  profileId: number,
  pin: string,
): Promise<PinCheckResult> {
  const [profile] = await db
    .select()
    .from(childProfiles)
    .where(eq(childProfiles.id, profileId));
  if (!profile) return { ok: false, reason: "not_found" };

  const lockState = {
    pinFailedAttempts: profile.pinFailedAttempts,
    pinLockedUntil: profile.pinLockedUntil,
  };
  if (isLocked(lockState)) return { ok: false, reason: "locked" };

  if (verifyPin(pin, profile.parentPinHash)) {
    if (profile.pinFailedAttempts > 0) {
      await db
        .update(childProfiles)
        .set({ pinFailedAttempts: 0, pinLockedUntil: null })
        .where(eq(childProfiles.id, profileId));
    }
    return { ok: true };
  }

  const next = onFailedAttempt(lockState);
  await db
    .update(childProfiles)
    .set(next)
    .where(eq(childProfiles.id, profileId));
  return { ok: false, reason: next.pinLockedUntil ? "locked" : "wrong_pin" };
}

export async function deleteProfile(profileId: number): Promise<void> {
  await db.delete(levelProgress).where(eq(levelProgress.profileId, profileId));
  await db.delete(themeHistory).where(eq(themeHistory.profileId, profileId));
  await db.delete(userBadges).where(eq(userBadges.profileId, profileId));
  await db.delete(vocabProgress).where(eq(vocabProgress.profileId, profileId));
  await db.delete(screenTimeTable).where(eq(screenTimeTable.profileId, profileId));
  await db.delete(levelsTable).where(eq(levelsTable.profileId, profileId));
  await db.delete(childProfiles).where(eq(childProfiles.id, profileId));
}

/* --------------------------- fin d'un niveau ------------------------------ */

export async function completeLevel(
  payload: CompleteLevelPayload,
): Promise<CompleteLevelResult | null> {
  await ensureSeed();
  const [profile] = await db
    .select()
    .from(childProfiles)
    .where(eq(childProfiles.id, payload.profileId));
  if (!profile) return null;

  const [level] = await db
    .select()
    .from(levelsTable)
    .where(
      and(
        eq(levelsTable.profileId, profile.id),
        eq(levelsTable.id, payload.levelId),
      ),
    );
  if (!level) return null;

  const blueprint = buildBlueprint({
    profileId: profile.id,
    numero: level.numero,
    themeId: level.themeId as ThemeId,
  });

  const quizParfait =
    payload.quizTotal > 0 && payload.quizScore === payload.quizTotal;

  const pointsBase =
    blueprint.lessons.length * POINTS.lecon +
    blueprint.vocab.length * POINTS.vocabulaire;
  const pointsJeu = payload.jeuScore * POINTS.jeu;
  const pointsQuiz = payload.quizScore * POINTS.quiz;
  const pointsBonus = (quizParfait ? POINTS.bonusSansFaute : 0) +
    (payload.actionFaite ? POINTS.actionReelle : 0);
  const pointsGagnes = pointsBase + pointsJeu + pointsQuiz + pointsBonus;

  let totalExercices = 0;
  if (blueprint.game.id === "tri") totalExercices = blueprint.game.items.length;
  else if (blueprint.game.id === "eau")
    totalExercices = blueprint.game.scenarios.length;
  else if (blueprint.game.id === "habitat")
    totalExercices = blueprint.game.species.length;
  else
    totalExercices = blueprint.game.spots.filter((s) => s.gaspillage).length;
  const score = Math.round(
    ((payload.jeuScore + payload.quizScore) /
      Math.max(1, totalExercices + payload.quizTotal)) *
    100,
  );

  const existing = await db
    .select()
    .from(levelProgress)
    .where(
      and(
        eq(levelProgress.profileId, profile.id),
        eq(levelProgress.levelId, level.id),
      ),
    );

  if (existing.length) {
    await db
      .update(levelProgress)
      .set({
        statut: "COMPLETED",
        score,
        pointsGagnes,
        jeuScore: payload.jeuScore,
        quizScore: payload.quizScore,
        dateCompletion: new Date(),
      })
      .where(eq(levelProgress.id, existing[0].id));
  } else {
    await db.insert(levelProgress).values({
      profileId: profile.id,
      levelId: level.id,
      statut: "COMPLETED",
      score,
      pointsGagnes,
      jeuScore: payload.jeuScore,
      quizScore: payload.quizScore,
      dateCompletion: new Date(),
    });
  }

  await db
    .update(levelsTable)
    .set({ statut: "COMPLETED" })
    .where(eq(levelsTable.id, level.id));

  // vocabulaire découvert (EcoLangues)
  if (blueprint.vocab.length) {
    await db
      .insert(vocabProgress)
      .values(
        blueprint.vocab.map((v) => ({ profileId: profile.id, vocabId: v.id })),
      )
      .onConflictDoNothing();
  }
  const [mots] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vocabProgress)
    .where(eq(vocabProgress.profileId, profile.id));

  const nouveauNiveau = Math.max(profile.niveau, level.numero + 1);
  await db
    .update(childProfiles)
    .set({
      niveau: nouveauNiveau,
      points: profile.points + pointsGagnes,
      missionsRealisees: profile.missionsRealisees + 1,
      actionsReelles: profile.actionsReelles + (payload.actionFaite ? 1 : 0),
      motsAppris: mots?.count ?? profile.motsAppris,
    })
    .where(eq(childProfiles.id, profile.id));

  await ensureLevelsAhead(profile.id, nouveauNiveau);

  // attribution des badges
  const completedThemes = await db
    .select({ themeId: levelsTable.themeId })
    .from(levelsTable)
    .where(
      and(
        eq(levelsTable.profileId, profile.id),
        eq(levelsTable.statut, "COMPLETED"),
      ),
    );
  const completedByTheme: Record<ThemeId, number> = {
    dechets: 0,
    eau: 0,
    biodiversite: 0,
    energie: 0,
  };
  for (const row of completedThemes) {
    const key = row.themeId as ThemeId;
    completedByTheme[key] = (completedByTheme[key] ?? 0) + 1;
  }

  const earnedIds = evaluateBadges({
    missionsRealisees: profile.missionsRealisees + 1,
    actionsReelles: profile.actionsReelles + (payload.actionFaite ? 1 : 0),
    motsAppris: mots?.count ?? profile.motsAppris,
    completedByTheme,
    quizParfait,
  });

  const already = await db
    .select({ badgeId: userBadges.badgeId })
    .from(userBadges)
    .where(eq(userBadges.profileId, profile.id));
  const alreadySet = new Set(already.map((r) => r.badgeId));
  const nouveaux = earnedIds.filter((id) => !alreadySet.has(id));

  if (nouveaux.length) {
    await db
      .insert(userBadges)
      .values(nouveaux.map((badgeId) => ({ profileId: profile.id, badgeId })))
      .onConflictDoNothing();
  }

  const nouveauxBadges = BADGES.filter((b) => nouveaux.includes(b.id)).map(
    (b) => ({
      id: b.id,
      nom: b.nom,
      description: b.description,
      condition: b.condition,
      emoji: b.emoji,
      ordre: b.ordre,
      obtenu: true,
    }),
  );

  const grade = gradeForLevel(nouveauNiveau);
  const next = nextGrade(nouveauNiveau);

  return {
    pointsGagnes,
    nouveauxBadges,
    niveauDebloque: nouveauNiveau,
    progressionVersGrade: {
      actuel: `${grade.emoji} ${grade.nom}`,
      suivant: next ? `${next.emoji} ${next.nom}` : null,
    },
  };
}

/* ------------------------------ temps d'écran ------------------------------ */

export async function addScreenTime(
  profileId: number,
  secondes: number,
  pause = false,
): Promise<{
  tempsUtilise: number;
  limiteSession: number;
  limiteJour: number;
  pauses: number;
} | null> {
  await ensureSeed();
  const [profile] = await db
    .select()
    .from(childProfiles)
    .where(eq(childProfiles.id, profileId));
  if (!profile) return null;

  const limits = screenLimitsForAge(profile.age);
  const today = todayKey();

  const [existing] = await db
    .select()
    .from(screenTimeTable)
    .where(
      and(eq(screenTimeTable.profileId, profileId), eq(screenTimeTable.date, today)),
    );

  if (!existing) {
    const [created] = await db
      .insert(screenTimeTable)
      .values({
        profileId,
        date: today,
        tempsUtilise: secondes,
        limiteSession: limits.sessionMinutes * 60,
        limiteJour: limits.jourMinutes * 60,
        pauses: pause ? 1 : 0,
      })
      .returning();
    return {
      tempsUtilise: created.tempsUtilise,
      limiteSession: created.limiteSession,
      limiteJour: created.limiteJour,
      pauses: created.pauses,
    };
  }

  const [updated] = await db
    .update(screenTimeTable)
    .set({
      tempsUtilise: existing.tempsUtilise + secondes,
      pauses: existing.pauses + (pause ? 1 : 0),
    })
    .where(eq(screenTimeTable.id, existing.id))
    .returning();

  return {
    tempsUtilise: updated.tempsUtilise,
    limiteSession: updated.limiteSession,
    limiteJour: updated.limiteJour,
    pauses: updated.pauses,
  };
}

export async function listProfileIds(): Promise<number[]> {
  const rows = await db.select({ id: childProfiles.id }).from(childProfiles);
  return rows.map((r) => r.id);
}

export async function profileExists(profileId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: childProfiles.id })
    .from(childProfiles)
    .where(eq(childProfiles.id, profileId));
  return Boolean(row);
}

export async function invalidatePinRecoveries(profileId: number) {
  await db
    .update(parentPinResets)
    .set({ usedAt: new Date() })
    .where(eq(parentPinResets.profileId, profileId));
}
export async function createPinRecovery(
  profileId: number,
  tokenHash: string,
  expiresAt: Date,
) {
  await invalidatePinRecoveries(profileId);
  await db.insert(parentPinResets).values({
    profileId,
    tokenHash,
    expiresAt,
  });
}

export async function findProfileByParentEmail(parentEmail: string) {
  const [profile] = await db
    .select()
    .from(childProfiles)
    .where(eq(childProfiles.parentEmail, parentEmail))
    .limit(1);

  return profile ?? null;
}
