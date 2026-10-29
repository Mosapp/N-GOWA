import type { JeuMission, MissionContent } from "./types";

/**
 * Ajoute à des missions leur jeu, leur décor et l'image dessinée de chaque
 * objet (fichiers produits par scripts/prepare-illustrations.mjs).
 */
export function illustrer(
  missions: MissionContent[],
  jeu: JeuMission,
  scene: (m: MissionContent) => string,
): MissionContent[] {
  return missions.map((m) => ({
    ...m,
    jeu,
    scene: `/illustrations/scenes/${scene(m)}.webp`,
    objets: m.objets.map((o) => ({ ...o, image: `/illustrations/objets/${o.id}.webp` })),
  }));
}
