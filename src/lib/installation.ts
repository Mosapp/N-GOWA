"use client";

import { useSyncExternalStore } from "react";

/* Installer N'GOWA sur l'écran d'accueil, comme une vraie application.
   - Android / Chrome / Edge : le navigateur propose l'installation
     (événement « beforeinstallprompt »), on la déclenche avec un bouton ;
   - iPhone / iPad : pas d'installation automatique, on explique le geste
     (Partager → Sur l'écran d'accueil). */

type InvitationInstallation = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type EtatInstallation = {
  /** L'app tourne déjà comme une application installée. */
  installee: boolean;
  /** Le navigateur peut installer d'un toucher. */
  possible: boolean;
  /** iPhone / iPad : installation à faire à la main. */
  ios: boolean;
};

let invitation: InvitationInstallation | null = null;
let installeeMaintenant = false;
const abonnes = new Set<() => void>();
let etat: EtatInstallation = { installee: false, possible: false, ios: false };

function calculer(): EtatInstallation {
  if (typeof window === "undefined") return etat;
  const autonome =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const suivant = { installee: autonome || installeeMaintenant, possible: Boolean(invitation), ios };
  if (suivant.installee !== etat.installee || suivant.possible !== etat.possible || suivant.ios !== etat.ios) etat = suivant;
  return etat;
}

function prevenir() {
  calculer();
  abonnes.forEach((f) => f());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    invitation = e as InvitationInstallation;
    prevenir();
  });
  window.addEventListener("appinstalled", () => {
    invitation = null;
    installeeMaintenant = true;
    prevenir();
  });
}

export function useInstallation(): EtatInstallation {
  return useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    calculer,
    () => etat,
  );
}

/** Ouvre la fenêtre d'installation du navigateur. Renvoie true si acceptée. */
export async function installer(): Promise<boolean> {
  if (!invitation) return false;
  const i = invitation;
  await i.prompt();
  const { outcome } = await i.userChoice;
  invitation = null;
  if (outcome === "accepted") installeeMaintenant = true;
  prevenir();
  return outcome === "accepted";
}
