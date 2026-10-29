import { describe, expect, it } from "vitest";

import {
  chargerSauvegarde,
  enregistrerSauvegarde,
  LEGACY_PROFILE_KEY,
  migrerSauvegarde,
  nettoyerPseudo,
  SAVE_BACKUP_KEY,
  SAVE_KEY,
  sauvegardeVide,
} from "./save";

const NOW = Date.UTC(2026, 9, 29, 10);

function memoire(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("sauvegarde locale", () => {
  it("enregistre puis relit la progression à l'identique", () => {
    const stockage = memoire();
    const save = {
      ...sauvegardeVide(NOW),
      profil: { pseudo: "Petit Baobab", avatar: "awa" as const, tranche: "6-8" as const, creeLe: "x" },
    };
    expect(enregistrerSauvegarde(stockage, save)).toBe(true);
    const relu = chargerSauvegarde(stockage, NOW);
    expect(relu.etat).toBe("chargee");
    expect(relu.sauvegarde).toEqual(save);
  });

  it("garde une copie et repart proprement si les données sont illisibles", () => {
    const stockage = memoire({ [SAVE_KEY]: "{pas du json" });
    const relu = chargerSauvegarde(stockage, NOW);
    expect(relu.etat).toBe("illisible");
    expect(relu.sauvegarde.profil).toBeNull();
    expect(stockage.data.get(SAVE_BACKUP_KEY)).toBe("{pas du json");
  });

  it("répare les champs abîmés au lieu de planter", () => {
    const save = migrerSauvegarde(
      {
        profil: { pseudo: "<b>Awa</b>", avatar: "dragon", tranche: "6-8" },
        missions: { "marche-adjoua": { meilleursPoints: -5, terminee: "oui" }, x: 3 },
        defis: { a: { statut: "pirate" }, b: { statut: "declare", accepteLe: "t" } },
        temps: { secondesJour: "beaucoup" },
      },
      NOW,
    );
    expect(save.profil).toMatchObject({ pseudo: "bAwab", avatar: "kofi", tranche: "6-8" });
    expect(save.missions["marche-adjoua"]).toMatchObject({ meilleursPoints: 0, terminee: false });
    expect(save.missions.x).toBeUndefined();
    expect(Object.keys(save.defis)).toEqual(["b"]);
    expect(save.temps.secondesJour).toBe(0);
  });

  it("nettoie l'ancienne clé de profil serveur", () => {
    const stockage = memoire({ [LEGACY_PROFILE_KEY]: "12" });
    chargerSauvegarde(stockage, NOW);
    expect(stockage.data.has(LEGACY_PROFILE_KEY)).toBe(false);
  });

  it("supporte un appareil qui refuse l'écriture", () => {
    const stockage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceeded");
      },
      removeItem: () => undefined,
    };
    expect(enregistrerSauvegarde(stockage, sauvegardeVide(NOW))).toBe(false);
  });

  it("limite et nettoie le pseudo", () => {
    expect(nettoyerPseudo("   Super    Trieur   du   quartier  ")).toBe("Super Trieur du");
  });
});
