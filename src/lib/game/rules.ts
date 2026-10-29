import { PINS } from "@/content/pins";
import { MISSIONS, SEUIL_COMPETENCE } from "@/content/village";
import { ZONES } from "@/content/zones";
import type {
  CompetenceId,
  Complexite,
  MissionContent,
  ObjetATrier,
  PinContent,
  TrancheAge,
  ZoneId,
} from "@/content/types";
import { jourLocal, type DefiStatut, type Sauvegarde } from "./save";

/* ------------------------------- âge -------------------------------------- */

export function complexitePour(tranche: TrancheAge): Complexite {
  return tranche === "4-5" ? "petit" : "grand";
}

/* ------------------------- aléatoire reproductible ------------------------ */

export function aleatoire(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function melanger<T>(items: readonly T[], rand: () => number): T[] {
  const copie = [...items];
  for (let i = copie.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/**
 * Choisit les objets d'une partie : uniquement ceux qui correspondent aux
 * bacs de la tranche d'âge, avec au moins un objet par bac, puis complète
 * au hasard.
 */
export function selectionnerObjets(
  mission: MissionContent,
  complexite: Complexite,
  graine: number,
): ObjetATrier[] {
  const rand = aleatoire(graine);
  const bacs = mission.bacs[complexite];
  const eligibles = mission.objets.filter(
    (o) => bacs.includes(o.bac) && (complexite === "grand" || !o.grandsSeulement),
  );
  const nombre = Math.min(mission.nombreObjets[complexite], eligibles.length);
  const melanges = melanger(eligibles, rand);
  const choisis: ObjetATrier[] = [];
  for (const bac of bacs) {
    const premier = melanges.find((o) => o.bac === bac && !choisis.includes(o));
    if (premier && choisis.length < nombre) choisis.push(premier);
  }
  for (const objet of melanges) {
    if (choisis.length >= nombre) break;
    if (!choisis.includes(objet)) choisis.push(objet);
  }
  return melanger(choisis, rand);
}

/* -------------------------------- points ---------------------------------- */

export const BAREME = {
  /** Bien placé du premier coup. */
  premierCoup: 10,
  /** Bien placé au deuxième essai. */
  deuxiemeEssai: 5,
  /** Bien placé après plusieurs essais : la persévérance compte aussi. */
  perseverance: 2,
  /** Bonne réponse à la question de compréhension (6-10 ans). */
  question: 10,
  /** Mission terminée jusqu'au bout. */
  missionTerminee: 20,
};

export function pointsObjet(essais: number): number {
  if (essais <= 1) return BAREME.premierCoup;
  if (essais === 2) return BAREME.deuxiemeEssai;
  return BAREME.perseverance;
}

export type ResultatObjet = { objetId: string; competence: CompetenceId; essais: number };

export type ResultatMission = {
  missionId: string;
  objets: ResultatObjet[];
  /** null quand il n'y a pas de question (4-5 ans). */
  questionReussie: boolean | null;
};

export function pointsMission(res: ResultatMission): number {
  const objets = res.objets.reduce((s, o) => s + pointsObjet(o.essais), 0);
  return objets + (res.questionReussie ? BAREME.question : 0) + BAREME.missionTerminee;
}

export function etoilesMission(res: ResultatMission): 1 | 2 | 3 {
  if (!res.objets.length) return 1;
  const ratio = res.objets.filter((o) => o.essais === 1).length / res.objets.length;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

/** Points de jeu : somme du meilleur score de chaque mission (rejouer ne « farme » pas). */
export function pointsTotal(save: Sauvegarde): number {
  return Object.values(save.missions).reduce((s, m) => s + m.meilleursPoints, 0);
}

export function pointsZone(save: Sauvegarde, zoneId: ZoneId): number {
  return MISSIONS.filter((m) => m.zoneId === zoneId).reduce(
    (s, m) => s + (save.missions[m.id]?.meilleursPoints ?? 0),
    0,
  );
}

/* ------------------------------ compétences ------------------------------- */

export function competenceDemontree(save: Sauvegarde, id: CompetenceId): boolean {
  return (save.competences[id]?.premierCoup ?? 0) >= SEUIL_COMPETENCE;
}

/* ----------------------------- déblocages -------------------------------- */

export type StatutMission = "verrouillee" | "disponible" | "terminee";

export function missionsDeZone(zoneId: ZoneId): MissionContent[] {
  return MISSIONS.filter((m) => m.zoneId === zoneId).sort((a, b) => a.ordre - b.ordre);
}

export function statutMission(save: Sauvegarde, mission: MissionContent): StatutMission {
  if (save.missions[mission.id]?.terminee) return "terminee";
  const precedente = missionsDeZone(mission.zoneId).find((m) => m.ordre === mission.ordre - 1);
  if (!precedente || save.missions[precedente.id]?.terminee) return "disponible";
  return "verrouillee";
}

export type StatutZone = "ouverte" | "verrouillee" | "bientot";

/**
 * - "bientot" : zone annoncée, sans missions ;
 * - "verrouillee" : jouable, mais la zone précédente n'est pas terminée ;
 * - "ouverte" : on peut y jouer.
 */
export function statutZone(save: Sauvegarde, zoneId: ZoneId): StatutZone {
  const index = ZONES.findIndex((z) => z.id === zoneId);
  const zone = ZONES[index];
  if (!zone || zone.disponibilite !== "jouable" || !missionsDeZone(zoneId).length) return "bientot";
  const precedente = ZONES[index - 1];
  if (!precedente) return "ouverte";
  const prog = progressionZone(save, precedente.id);
  return prog.terminees >= prog.total ? "ouverte" : "verrouillee";
}

export function progressionZone(save: Sauvegarde, zoneId: ZoneId) {
  const missions = missionsDeZone(zoneId);
  const terminees = missions.filter((m) => save.missions[m.id]?.terminee).length;
  const etoiles = missions.reduce((s, m) => s + (save.missions[m.id]?.meilleuresEtoiles ?? 0), 0);
  return { terminees, total: missions.length, etoiles, etoilesMax: missions.length * 3 };
}

/* --------------------------------- pins ----------------------------------- */

function zoneJouee(save: Sauvegarde, zoneId: ZoneId): boolean {
  return MISSIONS.some((m) => m.zoneId === zoneId && save.missions[m.id]?.terminee);
}

export function defisParStatut(save: Sauvegarde, statut: DefiStatut): number {
  return Object.values(save.defis).filter((d) => d.statut === statut).length;
}

export function pinMerite(save: Sauvegarde, pin: PinContent, dejaObtenus: Set<string>): boolean {
  const r = pin.regle;
  switch (r.type) {
    case "points-zone":
      return pointsZone(save, r.zoneId) >= r.seuil;
    case "points-total":
      return pointsTotal(save) >= r.seuil && zoneJouee(save, r.zoneRequise);
    case "competence":
      return Boolean(save.missions[r.missionId]?.terminee) && competenceDemontree(save, r.competence);
    case "defis-valides":
      return defisParStatut(save, "valide") >= r.nombre;
    case "champion":
      return pointsTotal(save) >= r.seuil && r.pinsRequis.every((id) => dejaObtenus.has(id));
  }
}

/** Progression lisible vers un pin (pour la collection). */
export function progressionPin(save: Sauvegarde, pin: PinContent): { actuel: number; cible: number } {
  const r = pin.regle;
  switch (r.type) {
    case "points-zone":
      return { actuel: Math.min(r.seuil, pointsZone(save, r.zoneId)), cible: r.seuil };
    case "points-total":
    case "champion":
      return { actuel: Math.min(r.seuil, pointsTotal(save)), cible: r.seuil };
    case "competence":
      return {
        actuel: Math.min(SEUIL_COMPETENCE, save.competences[r.competence]?.premierCoup ?? 0),
        cible: SEUIL_COMPETENCE,
      };
    case "defis-valides":
      return { actuel: Math.min(r.nombre, defisParStatut(save, "valide")), cible: r.nombre };
  }
}

/**
 * Ajoute les pins nouvellement mérités. Un pin obtenu reste acquis, même si
 * les seuils changent plus tard.
 */
export function synchroniserPins(
  save: Sauvegarde,
  maintenantIso: string,
): { save: Sauvegarde; nouveaux: string[] } {
  const obtenus = new Set(Object.keys(save.pins));
  const nouveaux: string[] = [];
  // Deux passes : le pin Champion dépend des autres pins.
  for (let passe = 0; passe < 2; passe += 1) {
    for (const pin of PINS) {
      if (obtenus.has(pin.id)) continue;
      if (pinMerite(save, pin, obtenus)) {
        obtenus.add(pin.id);
        nouveaux.push(pin.id);
      }
    }
  }
  if (!nouveaux.length) return { save, nouveaux };
  const pins = { ...save.pins };
  for (const id of nouveaux) pins[id] = { obtenuLe: maintenantIso, vu: false };
  return { save: { ...save, pins }, nouveaux };
}

/* ------------------------- appliquer un résultat -------------------------- */

export type BilanMission = {
  save: Sauvegarde;
  points: number;
  /** Points ajoutés au total (0 si le meilleur score n'est pas battu). */
  gain: number;
  etoiles: 1 | 2 | 3;
  nouveauxPins: string[];
  competencesDemontrees: CompetenceId[];
};

export function appliquerResultat(
  save: Sauvegarde,
  res: ResultatMission,
  maintenantIso: string,
): BilanMission {
  const points = pointsMission(res);
  const etoiles = etoilesMission(res);
  const avant = save.missions[res.missionId];
  const gain = Math.max(0, points - (avant?.meilleursPoints ?? 0));

  const competences = { ...save.competences };
  const avantDemontrees = new Set(
    (Object.keys(competences) as CompetenceId[]).filter((id) => competenceDemontree(save, id)),
  );
  for (const objet of res.objets) {
    const c = competences[objet.competence] ?? { premierCoup: 0, rencontres: 0 };
    competences[objet.competence] = {
      premierCoup: c.premierCoup + (objet.essais === 1 ? 1 : 0),
      rencontres: c.rencontres + 1,
    };
  }

  const jour = jourLocal(Date.parse(maintenantIso));
  const joursJoues = save.joursJoues.includes(jour) ? save.joursJoues : [...save.joursJoues, jour].slice(-14);

  const suivante: Sauvegarde = {
    ...save,
    joursJoues,
    competences,
    missions: {
      ...save.missions,
      [res.missionId]: {
        meilleursPoints: Math.max(points, avant?.meilleursPoints ?? 0),
        meilleuresEtoiles: Math.max(etoiles, avant?.meilleuresEtoiles ?? 0),
        parties: (avant?.parties ?? 0) + 1,
        terminee: true,
        derniereFois: maintenantIso,
      },
    },
  };

  const competencesDemontrees = (Object.keys(competences) as CompetenceId[]).filter(
    (id) => !avantDemontrees.has(id) && competenceDemontree(suivante, id),
  );
  const { save: avecPins, nouveaux } = synchroniserPins(suivante, maintenantIso);

  return { save: avecPins, points, gain, etoiles, nouveauxPins: nouveaux, competencesDemontrees };
}

/* ------------------------------ défis réels ------------------------------- */

export function accepterDefi(save: Sauvegarde, defiId: string, maintenantIso: string): Sauvegarde {
  if (save.defis[defiId]) return save;
  return { ...save, defis: { ...save.defis, [defiId]: { statut: "accepte", accepteLe: maintenantIso } } };
}

export function declarerDefi(save: Sauvegarde, defiId: string, maintenantIso: string): Sauvegarde {
  const defi = save.defis[defiId];
  if (!defi || defi.statut !== "accepte") return save;
  return {
    ...save,
    defis: { ...save.defis, [defiId]: { ...defi, statut: "declare", declareLe: maintenantIso } },
  };
}

/** Réservé à l'espace parent. */
export function validerDefi(
  save: Sauvegarde,
  defiId: string,
  maintenantIso: string,
): { save: Sauvegarde; nouveauxPins: string[] } {
  const defi = save.defis[defiId];
  if (!defi || defi.statut !== "declare") return { save, nouveauxPins: [] };
  const suivante: Sauvegarde = {
    ...save,
    defis: { ...save.defis, [defiId]: { ...defi, statut: "valide", valideLe: maintenantIso } },
  };
  const { save: avecPins, nouveaux } = synchroniserPins(suivante, maintenantIso);
  return { save: avecPins, nouveauxPins: nouveaux };
}

/** L'adulte n'a pas pu confirmer : le défi redevient « à faire », sans reproche. */
export function remettreDefiAFaire(save: Sauvegarde, defiId: string): Sauvegarde {
  const defi = save.defis[defiId];
  if (!defi || defi.statut !== "declare") return save;
  return {
    ...save,
    defis: { ...save.defis, [defiId]: { statut: "accepte", accepteLe: defi.accepteLe } },
  };
}

export function marquerPinsVus(save: Sauvegarde): Sauvegarde {
  if (!Object.values(save.pins).some((p) => !p.vu)) return save;
  const pins = Object.fromEntries(
    Object.entries(save.pins).map(([id, p]) => [id, { ...p, vu: true }]),
  );
  return { ...save, pins };
}

/* ----------------------------- tableau de bord ---------------------------- */

/** Prochaine mission à jouer (la première non terminée et disponible), sinon null. */
export function prochaineMission(save: Sauvegarde): MissionContent | null {
  for (const zone of ZONES) {
    if (statutZone(save, zone.id) !== "ouverte") continue;
    const m = missionsDeZone(zone.id).find((x) => statutMission(save, x) === "disponible");
    if (m) return m;
  }
  return null;
}

/** Prochain pin réellement atteignable aujourd'hui (dans une zone ouverte). */
export function prochainPin(save: Sauvegarde): PinContent | null {
  return (
    PINS.find(
      (p) =>
        !save.pins[p.id] &&
        p.regle.type !== "points-total" &&
        p.regle.type !== "champion" &&
        (p.regle.type !== "points-zone" || statutZone(save, p.regle.zoneId) === "ouverte"),
    ) ?? null
  );
}

/** Les 7 jours de la semaine en cours (lundi → dimanche), et s'ils ont été joués. */
export function semaine(save: Sauvegarde, now: number): { jour: string; initiale: string; joue: boolean; aujourdhui: boolean }[] {
  const d = new Date(now);
  const decalage = (d.getDay() + 6) % 7; // lundi = 0
  const lundi = new Date(d.getFullYear(), d.getMonth(), d.getDate() - decalage);
  const initiales = ["L", "M", "M", "J", "V", "S", "D"];
  const aujourdhui = jourLocal(now);
  return initiales.map((initiale, i) => {
    const jour = jourLocal(new Date(lundi.getFullYear(), lundi.getMonth(), lundi.getDate() + i).getTime());
    return { jour, initiale, joue: save.joursJoues.includes(jour), aujourdhui: jour === aujourdhui };
  });
}
