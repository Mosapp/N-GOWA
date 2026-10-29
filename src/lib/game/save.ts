import type { CompetenceId, TrancheAge } from "@/content/types";

/**
 * Sauvegarde locale de N'GOWA.
 *
 * Tout reste sur l'appareil (localStorage) : aucun compte, aucun serveur.
 * Le format est versionné pour pouvoir évoluer sans perdre la progression.
 */

export const SAVE_KEY = "ngowa.sauvegarde";
export const SAVE_BACKUP_KEY = "ngowa.sauvegarde.illisible";
/** Ancienne clé de la version serveur (profil distant) : nettoyée au démarrage. */
export const LEGACY_PROFILE_KEY = "ngowa.profileId";
export const SAVE_VERSION = 1;

export const AVATAR_IDS = ["kofi", "awa", "elephant", "tortue", "calao", "papillon"] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];

export const TRANCHES: TrancheAge[] = ["4-5", "6-8", "9-10"];

export type Profil = {
  pseudo: string;
  avatar: AvatarId;
  tranche: TrancheAge;
  creeLe: string;
};

export type MissionRecord = {
  meilleursPoints: number;
  meilleuresEtoiles: number;
  parties: number;
  terminee: boolean;
  derniereFois: string;
};

export type CompetenceRecord = {
  /** Objets bien placés du premier coup. */
  premierCoup: number;
  /** Objets rencontrés au total. */
  rencontres: number;
};

/**
 * accepte : l'enfant a choisi de relever le défi ;
 * declare : l'enfant dit l'avoir fait ;
 * valide  : un adulte a confirmé dans l'espace parent.
 */
export type DefiStatut = "accepte" | "declare" | "valide";

export type DefiRecord = {
  statut: DefiStatut;
  accepteLe: string;
  declareLe?: string;
  valideLe?: string;
};

export type TempsEcran = {
  /** Jour local AAAA-MM-JJ. */
  date: string;
  secondesJour: number;
  secondesSession: number;
  /** Horodatage (ms) de la dernière seconde de jeu comptée. */
  derniereActivite: number;
  /** Début de la pause en cours (ms), sinon null. */
  pauseDebut: number | null;
  /** Minutes accordées en plus par un adulte aujourd'hui (en secondes). */
  bonusJour: number;
};

export type Reglages = {
  sons: boolean;
  voix: boolean;
  animationsReduites: boolean;
};

export type EspaceParent = {
  pinHash: string | null;
  sel: string | null;
  echecs: number;
  bloqueJusqua: number | null;
};

export type PinObtenu = { obtenuLe: string; vu: boolean };

export type Sauvegarde = {
  version: typeof SAVE_VERSION;
  profil: Profil | null;
  decouverteVue: boolean;
  /** Jours (AAAA-MM-JJ) où une mission a été terminée, 14 au plus. Pas de « série » à perdre. */
  joursJoues: string[];
  missions: Record<string, MissionRecord>;
  competences: Partial<Record<CompetenceId, CompetenceRecord>>;
  defis: Record<string, DefiRecord>;
  pins: Record<string, PinObtenu>;
  temps: TempsEcran;
  reglages: Reglages;
  parent: EspaceParent;
};

export function jourLocal(ms: number): string {
  const d = new Date(ms);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const jj = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${jj}`;
}

export function sauvegardeVide(now: number): Sauvegarde {
  return {
    version: SAVE_VERSION,
    profil: null,
    decouverteVue: false,
    joursJoues: [],
    missions: {},
    competences: {},
    defis: {},
    pins: {},
    temps: {
      date: jourLocal(now),
      secondesJour: 0,
      secondesSession: 0,
      derniereActivite: 0,
      pauseDebut: null,
      bonusJour: 0,
    },
    reglages: { sons: true, voix: true, animationsReduites: false },
    parent: { pinHash: null, sel: null, echecs: 0, bloqueJusqua: null },
  };
}

/* ------------------------------ validation ------------------------------- */

type Brut = Record<string, unknown>;

const isObj = (v: unknown): v is Brut => typeof v === "object" && v !== null && !Array.isArray(v);
const nombre = (v: unknown, defaut = 0) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : defaut;
const texte = (v: unknown, defaut = "") => (typeof v === "string" ? v : defaut);
const booleen = (v: unknown, defaut: boolean) => (typeof v === "boolean" ? v : defaut);

export function nettoyerPseudo(brut: string): string {
  return brut
    .replace(/[<>{}[\]\\/"`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16)
    .trim();
}

function lireProfil(v: unknown): Profil | null {
  if (!isObj(v)) return null;
  const pseudo = nettoyerPseudo(texte(v.pseudo));
  const avatar = AVATAR_IDS.includes(v.avatar as AvatarId) ? (v.avatar as AvatarId) : "kofi";
  const tranche = TRANCHES.includes(v.tranche as TrancheAge) ? (v.tranche as TrancheAge) : null;
  if (pseudo.length < 2 || !tranche) return null;
  return { pseudo, avatar, tranche, creeLe: texte(v.creeLe, new Date(0).toISOString()) };
}

function lireDictionnaire<T>(v: unknown, lire: (x: unknown) => T | null): Record<string, T> {
  const out: Record<string, T> = {};
  if (!isObj(v)) return out;
  for (const [cle, valeur] of Object.entries(v)) {
    const lu = lire(valeur);
    if (lu) out[cle] = lu;
  }
  return out;
}

const STATUTS: DefiStatut[] = ["accepte", "declare", "valide"];

/**
 * Transforme n'importe quelle donnée lue sur l'appareil en sauvegarde valide.
 * Les champs inconnus ou abîmés reprennent leur valeur par défaut.
 */
export function migrerSauvegarde(brut: unknown, now: number): Sauvegarde {
  const base = sauvegardeVide(now);
  if (!isObj(brut)) return base;

  const temps = isObj(brut.temps) ? brut.temps : {};
  const reglages = isObj(brut.reglages) ? brut.reglages : {};
  const parent = isObj(brut.parent) ? brut.parent : {};

  return {
    version: SAVE_VERSION,
    profil: lireProfil(brut.profil),
    decouverteVue: booleen(brut.decouverteVue, false),
    joursJoues: Array.isArray(brut.joursJoues)
      ? brut.joursJoues.filter((j): j is string => typeof j === "string" && /^\d{4}-\d{2}-\d{2}$/.test(j)).slice(-14)
      : [],
    missions: lireDictionnaire(brut.missions, (m) =>
      isObj(m)
        ? {
            meilleursPoints: nombre(m.meilleursPoints),
            meilleuresEtoiles: Math.min(3, nombre(m.meilleuresEtoiles)),
            parties: nombre(m.parties),
            terminee: booleen(m.terminee, false),
            derniereFois: texte(m.derniereFois),
          }
        : null,
    ),
    competences: lireDictionnaire(brut.competences, (c) =>
      isObj(c) ? { premierCoup: nombre(c.premierCoup), rencontres: nombre(c.rencontres) } : null,
    ),
    defis: lireDictionnaire(brut.defis, (d) =>
      isObj(d) && STATUTS.includes(d.statut as DefiStatut)
        ? {
            statut: d.statut as DefiStatut,
            accepteLe: texte(d.accepteLe),
            ...(typeof d.declareLe === "string" ? { declareLe: d.declareLe } : {}),
            ...(typeof d.valideLe === "string" ? { valideLe: d.valideLe } : {}),
          }
        : null,
    ),
    pins: lireDictionnaire(brut.pins, (p) =>
      isObj(p) ? { obtenuLe: texte(p.obtenuLe), vu: booleen(p.vu, true) } : null,
    ),
    temps: {
      date: texte(temps.date, base.temps.date),
      secondesJour: nombre(temps.secondesJour),
      secondesSession: nombre(temps.secondesSession),
      derniereActivite: nombre(temps.derniereActivite),
      pauseDebut: typeof temps.pauseDebut === "number" ? nombre(temps.pauseDebut) : null,
      bonusJour: nombre(temps.bonusJour),
    },
    reglages: {
      sons: booleen(reglages.sons, true),
      voix: booleen(reglages.voix, true),
      animationsReduites: booleen(reglages.animationsReduites, false),
    },
    parent: {
      pinHash: typeof parent.pinHash === "string" ? parent.pinHash : null,
      sel: typeof parent.sel === "string" ? parent.sel : null,
      echecs: nombre(parent.echecs),
      bloqueJusqua: typeof parent.bloqueJusqua === "number" ? parent.bloqueJusqua : null,
    },
  };
}

/* ------------------------------- stockage -------------------------------- */

export type StockageMinimal = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type ResultatChargement = {
  sauvegarde: Sauvegarde;
  etat: "nouvelle" | "chargee" | "illisible";
};

export function chargerSauvegarde(stockage: StockageMinimal | null, now: number): ResultatChargement {
  if (!stockage) return { sauvegarde: sauvegardeVide(now), etat: "nouvelle" };
  let brut: string | null = null;
  try {
    brut = stockage.getItem(SAVE_KEY);
    stockage.removeItem(LEGACY_PROFILE_KEY);
  } catch {
    return { sauvegarde: sauvegardeVide(now), etat: "nouvelle" };
  }
  if (!brut) return { sauvegarde: sauvegardeVide(now), etat: "nouvelle" };
  try {
    return { sauvegarde: migrerSauvegarde(JSON.parse(brut), now), etat: "chargee" };
  } catch {
    try {
      stockage.setItem(SAVE_BACKUP_KEY, brut);
    } catch {
      /* rien à faire : l'appareil refuse l'écriture */
    }
    return { sauvegarde: sauvegardeVide(now), etat: "illisible" };
  }
}

export function enregistrerSauvegarde(stockage: StockageMinimal | null, sauvegarde: Sauvegarde): boolean {
  if (!stockage) return false;
  try {
    stockage.setItem(SAVE_KEY, JSON.stringify(sauvegarde));
    return true;
  } catch {
    return false;
  }
}
