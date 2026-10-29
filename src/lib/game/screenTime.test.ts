import { describe, expect, it } from "vitest";

import { jourLocal, sauvegardeVide } from "./save";
import {
  accorderBonus,
  ajouterTempsActif,
  commencerPause,
  limitesPour,
  normaliserTemps,
  statutTemps,
} from "./screenTime";

const T0 = new Date(2026, 9, 29, 9, 0, 0).getTime();
const MIN = 60 * 1000;

describe("limites par tranche d'âge", () => {
  it("respecte le cahier des charges", () => {
    expect(limitesPour("4-5")).toMatchObject({ sessionSec: 900, jourSec: 1800 });
    expect(limitesPour("6-8")).toMatchObject({ sessionSec: 1200, jourSec: 2400 });
    expect(limitesPour("9-10")).toMatchObject({ sessionSec: 1800, jourSec: 3600 });
  });
});

describe("déroulement d'une session (4-5 ans)", () => {
  const L = limitesPour("4-5");

  it("prévient, propose la pause, puis rouvre une nouvelle session", () => {
    let t = sauvegardeVide(T0).temps;
    t = ajouterTempsActif(t, 12 * 60, T0 + 12 * MIN);
    expect(statutTemps(t, L, T0 + 12 * MIN).etat).toBe("libre");

    t = ajouterTempsActif(t, 60, T0 + 13 * MIN);
    expect(statutTemps(t, L, T0 + 13 * MIN).etat).toBe("bientot");

    t = ajouterTempsActif(t, 120, T0 + 15 * MIN);
    expect(statutTemps(t, L, T0 + 15 * MIN).etat).toBe("pause-due");

    // La mission en cours continue d'être comptée (conclusion naturelle).
    t = ajouterTempsActif(t, 30, T0 + 15.5 * MIN);
    expect(t.secondesSession).toBe(15 * 60 + 30);

    t = commencerPause(t, T0 + 16 * MIN);
    const pendant = statutTemps(t, L, T0 + 20 * MIN);
    expect(pendant).toEqual({ etat: "en-pause", resteSec: 6 * 60 });

    // Le temps n'avance pas pendant la pause.
    expect(ajouterTempsActif(t, 30, T0 + 21 * MIN)).toBe(t);

    t = normaliserTemps(t, T0 + 26 * MIN, L);
    expect(t.pauseDebut).toBeNull();
    expect(t.secondesSession).toBe(0);
    expect(statutTemps(t, L, T0 + 26 * MIN).etat).toBe("libre");
  });

  it("recharger la page ne contourne pas la pause", () => {
    let t = ajouterTempsActif(sauvegardeVide(T0).temps, 15 * 60, T0 + 15 * MIN);
    t = commencerPause(t, T0 + 15 * MIN);
    const apresRechargement = normaliserTemps(t, T0 + 17 * MIN, L);
    expect(statutTemps(apresRechargement, L, T0 + 17 * MIN).etat).toBe("en-pause");
  });

  it("une longue absence compte comme une pause", () => {
    let t = ajouterTempsActif(sauvegardeVide(T0).temps, 14 * 60, T0 + 14 * MIN);
    t = normaliserTemps(t, T0 + 40 * MIN, L);
    expect(t.secondesSession).toBe(0);
    expect(t.secondesJour).toBe(14 * 60);
  });

  it("arrête la journée à 30 minutes, puis repart le lendemain", () => {
    let t = ajouterTempsActif(sauvegardeVide(T0).temps, 30 * 60, T0 + 60 * MIN);
    expect(statutTemps(t, L, T0 + 60 * MIN).etat).toBe("fin-journee");
    const demain = T0 + 24 * 60 * MIN;
    t = normaliserTemps(t, demain, L);
    expect(t.date).toBe(jourLocal(demain));
    expect(t.secondesJour).toBe(0);
    expect(statutTemps(t, L, demain).etat).toBe("libre");
  });

  it("un adulte peut accorder des minutes en plus", () => {
    let t = ajouterTempsActif(sauvegardeVide(T0).temps, 30 * 60, T0 + 60 * MIN);
    t = accorderBonus(t, 10);
    expect(statutTemps(t, L, T0 + 60 * MIN).etat).not.toBe("fin-journee");
    t = ajouterTempsActif(t, 10 * 60, T0 + 70 * MIN);
    expect(statutTemps(t, L, T0 + 70 * MIN).etat).toBe("fin-journee");
  });
});
