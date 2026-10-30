import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/** Le service worker doit précharger toutes les illustrations pour jouer hors ligne. */
describe("hors ligne", () => {
  const sw = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");
  const dossiers = ["mascots", "persos", "decors", "missions", "avatars", "scenes", "objets", "poubelles", "jeux"];

  it.each(dossiers)("chaque image de illustrations/%s est préchargée", (dossier) => {
    const fichiers = readdirSync(join(process.cwd(), "public", "illustrations", dossier)).filter((f) => f.endsWith(".webp"));
    expect(fichiers.length).toBeGreaterThan(0);
    for (const f of fichiers) {
      const nom = f.replace(/\.webp$/, "");
      // Liste de noms + modèle de chemin du dossier (ou suffixe -corps / -couvercle).
      const base = nom.replace(/-(corps|couvercle)$/, "");
      expect(sw.includes(`"${nom}"`) || sw.includes(`"${base}"`), `${dossier}/${f}`).toBe(true);
      expect(sw.includes(`/illustrations/${dossier}/`), dossier).toBe(true);
    }
  });
});
