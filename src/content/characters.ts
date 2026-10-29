/**
 * Personnages de N'GOWA.
 * Kofi et Awa sont illustrés (public/mascots/*.webp).
 * Les personnages secondaires du Village sont représentés par un portrait
 * simple (emoji dans un médaillon) en attendant leurs illustrations.
 */

export type MascotId = "kofi" | "awa";

export const MASCOTS: Record<
  MascotId,
  { nom: string; role: string; image: string; largeur: number; hauteur: number; couleur: string }
> = {
  kofi: {
    nom: "Kofi",
    role: "Jeune explorateur curieux",
    image: "/mascots/kofi.webp",
    largeur: 318,
    hauteur: 420,
    couleur: "#E0762E",
  },
  awa: {
    nom: "Awa",
    role: "Guide enthousiaste de la nature",
    image: "/mascots/awa.webp",
    largeur: 286,
    hauteur: 420,
    couleur: "#7A4BC0",
  },
};

export type SecondaryCharacter = {
  id: string;
  nom: string;
  role: string;
  emoji: string;
  couleur: string;
};

export const SECONDARY_CHARACTERS: Record<string, SecondaryCharacter> = {
  adjoua: {
    id: "adjoua",
    nom: "Tantie Adjoua",
    role: "Vendeuse au marché",
    emoji: "👩🏾‍🌾",
    couleur: "#F6B427",
  },
  yao: {
    id: "yao",
    nom: "Maître Yao",
    role: "Instituteur de l'école",
    emoji: "👨🏿‍🏫",
    couleur: "#1A6FA8",
  },
  akissi: {
    id: "akissi",
    nom: "Mamie Akissi",
    role: "Couturière, reine de la récup'",
    emoji: "👵🏾",
    couleur: "#B4532A",
  },
  bamba: {
    id: "bamba",
    nom: "Madame Bamba",
    role: "Infirmière du quartier",
    emoji: "👩🏾‍⚕️",
    couleur: "#C9432C",
  },
};
