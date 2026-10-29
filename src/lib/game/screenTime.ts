import type { TrancheAge } from "@/content/types";
import { jourLocal, type TempsEcran } from "./save";

/**
 * Temps d'écran géré localement, sans pression :
 * - on prévient l'enfant un peu avant la fin ;
 * - une mission commencée peut toujours se terminer ;
 * - la pause propose une activité hors écran.
 *
 * Seul le temps où l'application est visible est compté.
 */

export type Limites = {
  sessionSec: number;
  jourSec: number;
  pauseSec: number;
  /** Préavis avant la fin d'une session ou de la journée. */
  preavisSec: number;
};

export const LIMITES: Record<TrancheAge, Limites> = {
  "4-5": { sessionSec: 15 * 60, jourSec: 30 * 60, pauseSec: 10 * 60, preavisSec: 2 * 60 },
  "6-8": { sessionSec: 20 * 60, jourSec: 40 * 60, pauseSec: 10 * 60, preavisSec: 2 * 60 },
  "9-10": { sessionSec: 30 * 60, jourSec: 60 * 60, pauseSec: 10 * 60, preavisSec: 2 * 60 },
};

export function limitesPour(tranche: TrancheAge): Limites {
  return LIMITES[tranche];
}

/**
 * Remet les compteurs à jour selon l'heure :
 * - nouveau jour : tout repart à zéro ;
 * - pause terminée : nouvelle session ;
 * - application fermée assez longtemps : c'était déjà une vraie pause.
 */
export function normaliserTemps(t: TempsEcran, now: number, limites: Limites): TempsEcran {
  const aujourdhui = jourLocal(now);
  if (t.date !== aujourdhui) {
    return {
      date: aujourdhui,
      secondesJour: 0,
      secondesSession: 0,
      derniereActivite: t.derniereActivite,
      pauseDebut: null,
      bonusJour: 0,
    };
  }
  if (t.pauseDebut !== null) {
    if (now - t.pauseDebut >= limites.pauseSec * 1000) {
      return { ...t, pauseDebut: null, secondesSession: 0 };
    }
    return t;
  }
  if (
    t.secondesSession > 0 &&
    t.derniereActivite > 0 &&
    now - t.derniereActivite >= limites.pauseSec * 1000
  ) {
    return { ...t, secondesSession: 0 };
  }
  return t;
}

export type StatutTemps =
  | { etat: "libre"; resteSession: number; resteJour: number }
  | { etat: "bientot"; resteSession: number; resteJour: number }
  | { etat: "pause-due" }
  | { etat: "en-pause"; resteSec: number }
  | { etat: "fin-journee" };

export function limiteJour(t: TempsEcran, limites: Limites): number {
  return limites.jourSec + t.bonusJour;
}

export function statutTemps(t: TempsEcran, limites: Limites, now: number): StatutTemps {
  if (t.secondesJour >= limiteJour(t, limites)) return { etat: "fin-journee" };
  if (t.pauseDebut !== null) {
    const resteSec = Math.max(0, Math.ceil(limites.pauseSec - (now - t.pauseDebut) / 1000));
    return { etat: "en-pause", resteSec };
  }
  if (t.secondesSession >= limites.sessionSec) return { etat: "pause-due" };
  const resteSession = limites.sessionSec - t.secondesSession;
  const resteJour = limiteJour(t, limites) - t.secondesJour;
  if (Math.min(resteSession, resteJour) <= limites.preavisSec) {
    return { etat: "bientot", resteSession, resteJour };
  }
  return { etat: "libre", resteSession, resteJour };
}

/**
 * Ajoute du temps de jeu actif. Le temps continue d'être compté si une
 * mission se termine après la limite (conclusion naturelle), mais jamais
 * pendant une pause.
 */
export function ajouterTempsActif(t: TempsEcran, secondes: number, now: number): TempsEcran {
  if (secondes <= 0 || t.pauseDebut !== null) return t;
  return {
    ...t,
    secondesJour: t.secondesJour + secondes,
    secondesSession: t.secondesSession + secondes,
    derniereActivite: now,
  };
}

export function commencerPause(t: TempsEcran, now: number): TempsEcran {
  if (t.pauseDebut !== null) return t;
  return { ...t, pauseDebut: now };
}

/**
 * Un adulte accorde quelques minutes de plus aujourd'hui (espace parent).
 * La session repart de zéro pour que ces minutes soient vraiment jouables.
 */
export function accorderBonus(t: TempsEcran, minutes: number): TempsEcran {
  return {
    ...t,
    bonusJour: t.bonusJour + Math.max(0, Math.round(minutes * 60)),
    secondesSession: 0,
    pauseDebut: null,
  };
}
