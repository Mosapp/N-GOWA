/**
 * Personnages de N'GOWA.
 * Kofi et Awa sont illustrés en 3D, avec plusieurs poses
 * (public/illustrations/mascots). Les personnages du village ont un portrait
 * (public/illustrations/persos).
 */

export type MascotId = "kofi" | "awa";
export type Pose = "salue" | "montre" | "bravo" | "reflechit" | "explique" | "indice";

type Illustration = { image: string; largeur: number; hauteur: number };

const pose = (fichier: string, largeur: number, hauteur = 640): Illustration => ({
  image: `/illustrations/mascots/${fichier}.webp`,
  largeur,
  hauteur,
});

export const MASCOTS: Record<
  MascotId,
  { nom: string; role: string; couleur: string; poses: Partial<Record<Pose, Illustration>>; parDefaut: Pose }
> = {
  kofi: {
    nom: "Kofi",
    role: "Jeune explorateur curieux",
    couleur: "#E0762E",
    parDefaut: "salue",
    poses: {
      salue: pose("kofi-salue", 390),
      montre: pose("kofi-montre", 385),
      bravo: pose("kofi-bravo", 339),
      reflechit: pose("kofi-reflechit", 327),
    },
  },
  awa: {
    nom: "Awa",
    role: "Guide enthousiaste de la nature",
    couleur: "#7A4BC0",
    parDefaut: "salue",
    poses: {
      salue: pose("awa-salue", 376),
      explique: pose("awa-explique", 341),
      bravo: pose("awa-bravo", 453),
      indice: pose("awa-indice", 298),
    },
  },
};

/** Illustration d'une pose ; repli sur la pose par défaut si elle n'existe pas. */
export function illustrationMascotte(id: MascotId, p?: Pose): Illustration {
  const m = MASCOTS[id];
  return (p && m.poses[p]) || m.poses[m.parDefaut]!;
}

export type SecondaryCharacter = {
  id: string;
  nom: string;
  role: string;
  emoji: string;
  couleur: string;
  portrait: string;
  /** Cadrage du portrait dans le médaillon (object-position CSS) et zoom. */
  cadrage?: string;
  zoom?: number;
};

export const SECONDARY_CHARACTERS: Record<string, SecondaryCharacter> = {
  // Kofi et Awa guident aussi certaines missions (Rivière Vivante).
  awa: {
    id: "awa",
    portrait: "/illustrations/mascots/awa-explique.webp",
    cadrage: "50% 4%",
    zoom: 1.9,
    nom: "Awa",
    role: "Guide de la nature",
    emoji: "👧🏾",
    couleur: "#7A4BC0",
  },
  kofi: {
    id: "kofi",
    portrait: "/illustrations/mascots/kofi-montre.webp",
    cadrage: "38% 4%",
    zoom: 1.9,
    nom: "Kofi",
    role: "Jeune explorateur",
    emoji: "👦🏾",
    couleur: "#E0762E",
  },
  adjoua: {
    id: "adjoua",
    portrait: "/illustrations/persos/adjoua.webp",
    nom: "Tantie Adjoua",
    role: "Vendeuse au marché",
    emoji: "👩🏾‍🌾",
    couleur: "#F6B427",
  },
  yao: {
    id: "yao",
    portrait: "/illustrations/persos/yao.webp",
    nom: "Maître Yao",
    role: "Instituteur de l'école",
    emoji: "👨🏿‍🏫",
    couleur: "#1A6FA8",
  },
  akissi: {
    id: "akissi",
    portrait: "/illustrations/persos/akissi.webp",
    nom: "Mamie Akissi",
    role: "Couturière, reine de la récup'",
    emoji: "👵🏾",
    couleur: "#B4532A",
  },
  bamba: {
    id: "bamba",
    portrait: "/illustrations/persos/bamba.webp",
    nom: "Madame Bamba",
    role: "Infirmière du quartier",
    emoji: "👩🏾‍⚕️",
    couleur: "#C9432C",
  },
};
