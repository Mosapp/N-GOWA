"use client";

import { useSyncExternalStore } from "react";

import {
  chargerSauvegarde,
  enregistrerSauvegarde,
  SAVE_KEY,
  type ResultatChargement,
  type Sauvegarde,
  type StockageMinimal,
} from "./save";

/**
 * Store local de N'GOWA : une seule source de vérité, persistée dans
 * localStorage à chaque modification et synchronisée entre onglets.
 */

let courante: Sauvegarde | null = null;
let etatChargement: ResultatChargement["etat"] = "nouvelle";
let ecritureOk = true;
const abonnes = new Set<() => void>();

function stockage(): StockageMinimal | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function charger(): Sauvegarde {
  if (!courante) {
    const resultat = chargerSauvegarde(stockage(), Date.now());
    courante = resultat.sauvegarde;
    etatChargement = resultat.etat;
  }
  return courante;
}

function prevenir() {
  for (const abonne of abonnes) abonne();
}

function surStockage(event: StorageEvent) {
  if (event.key !== SAVE_KEY) return;
  courante = null;
  charger();
  prevenir();
}

function abonner(abonne: () => void) {
  abonnes.add(abonne);
  if (abonnes.size === 1) window.addEventListener("storage", surStockage);
  return () => {
    abonnes.delete(abonne);
    if (!abonnes.size) window.removeEventListener("storage", surStockage);
  };
}

export function lireSauvegarde(): Sauvegarde {
  return charger();
}

export function modifierSauvegarde(modif: (save: Sauvegarde) => Sauvegarde): Sauvegarde {
  const avant = charger();
  const apres = modif(avant);
  if (apres === avant) return avant;
  courante = apres;
  ecritureOk = enregistrerSauvegarde(stockage(), apres);
  prevenir();
  return apres;
}

export function infosStockage() {
  return { etatChargement, ecritureOk };
}

/** null côté serveur et pendant l'hydratation, la sauvegarde ensuite. */
export function useSauvegarde(): Sauvegarde | null {
  return useSyncExternalStore(abonner, charger, () => null);
}

/* ---------------------------- horloge partagée --------------------------- */

let maintenant = typeof window !== "undefined" ? Date.now() : 0;
const abonnesHorloge = new Set<() => void>();
let minuterie: number | null = null;

function abonnerHorloge(abonne: () => void) {
  abonnesHorloge.add(abonne);
  if (minuterie === null) {
    minuterie = window.setInterval(() => {
      maintenant = Date.now();
      for (const a of abonnesHorloge) a();
    }, 1000);
  }
  return () => {
    abonnesHorloge.delete(abonne);
    if (!abonnesHorloge.size && minuterie !== null) {
      window.clearInterval(minuterie);
      minuterie = null;
    }
  };
}

/** Heure courante, rafraîchie chaque seconde (0 pendant le rendu serveur). */
export function useMaintenant(): number {
  return useSyncExternalStore(
    abonnerHorloge,
    () => maintenant,
    () => 0,
  );
}
