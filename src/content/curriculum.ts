import type {
  LessonContent,
  OffScreenAction,
  Palier,
  PalierLabel,
  ThemeContent,
  ThemeId,
  VocabContent,
} from "./types";

export const THEMES: ThemeContent[] = [
  {
    id: "dechets",
    nom: "Le Monde des Déchets",
    categorie: "Déchets",
    icone: "♻️",
    couleur: "#FF9600",
    couleurClair: "#FFF1DE",
    description:
      "Apprendre à reconnaître les déchets de la maison, du marché et de l'école, puis à les trier.",
    miniJeu: "À quelle poubelle ?",
    consigneJeu: "Fais glisser chaque déchet dans la bonne poubelle !",
  },
  {
    id: "eau",
    nom: "Le Monde de l'Eau",
    categorie: "Eau",
    icone: "💧",
    couleur: "#1CB0F6",
    couleurClair: "#E3F5FF",
    description:
      "Comprendre que l'eau est précieuse : robinet, bassine, fuite, rivière et lagune.",
    miniJeu: "Sauve l'eau !",
    consigneJeu: "Agis vite : trouve le bon geste avant que l'eau ne s'échappe !",
  },
  {
    id: "biodiversite",
    nom: "Le Monde de la Vie",
    categorie: "Biodiversité",
    icone: "🦋",
    couleur: "#58CC02",
    couleurClair: "#E8F8DC",
    description:
      "Découvrir les animaux, les plantes et les habitats de la savane, de la forêt et de la lagune.",
    miniJeu: "Qui vit où ?",
    consigneJeu: "Associe chaque animal ou plante à son habitat.",
  },
  {
    id: "energie",
    nom: "Le Monde de l'Énergie",
    categorie: "Énergie",
    icone: "☀️",
    couleur: "#FFC800",
    couleurClair: "#FFF8DC",
    description:
      "Éviter le gaspillage d'énergie à la maison et découvrir le soleil comme allié.",
    miniJeu: "Chasseur de gaspillage",
    consigneJeu: "Trouve tout ce qui gaspille de l'énergie dans la maison.",
  },
];

export const THEME_BY_ID: Record<ThemeId, ThemeContent> = THEMES.reduce(
  (acc, theme) => ({ ...acc, [theme.id]: theme }),
  {} as Record<ThemeId, ThemeContent>,
);

export const PALIERS: PalierLabel[] = [
  {
    id: "decouverte",
    nom: "Découverte",
    verbe: "DÉCOUVRIR",
    description: "Reconnaître, associer, trier, choisir.",
  },
  {
    id: "comprehension",
    nom: "Compréhension",
    verbe: "COMPRENDRE",
    description: "Comparer, repérer une mauvaise pratique, résoudre une situation.",
  },
  {
    id: "application",
    nom: "Application",
    verbe: "AGIR",
    description: "Plusieurs étapes, des choix qui ont des conséquences.",
  },
  {
    id: "maitrise",
    nom: "Maîtrise",
    verbe: "TRANSMETTRE",
    description: "Situations complexes qui combinent plusieurs mondes.",
  },
];

export function palierFromLevel(numero: number): Palier {
  if (numero <= 5) return "decouverte";
  if (numero <= 10) return "comprehension";
  if (numero <= 20) return "application";
  return "maitrise";
}

/** 24 leçons : 6 par monde, réparties sur les 4 paliers. */
export const LESSONS: LessonContent[] = [
  /* ------------------------- DÉCHETS ------------------------- */
  {
    id: "dec-1",
    themeId: "dechets",
    titre: "C'est quoi, un déchet ?",
    contenu:
      "Quand tu finis un sachet d'eau, il devient un déchet. Un déchet, c'est ce qu'on ne peut plus utiliser. Chaque déchet a sa place !",
    emoji: "🥤",
    audioFr:
      "Un déchet, c'est ce qu'on ne peut plus utiliser. Chaque déchet a sa place.",
    ordre: 1,
    palier: "decouverte",
  },
  {
    id: "dec-2",
    themeId: "dechets",
    titre: "Les poubelles de la maison",
    contenu:
      "À la maison, on met les épluchures d'igname dans la poubelle marron, les bouteilles en plastique dans la poubelle jaune, le papier dans la bleue.",
    emoji: "🗑️",
    audioFr:
      "Les épluchures vont dans la poubelle marron, le plastique dans la jaune, le papier dans la bleue.",
    ordre: 2,
    palier: "decouverte",
  },
  {
    id: "dec-3",
    themeId: "dechets",
    titre: "Le sachet d'eau dans la rue",
    contenu:
      "Un sachet d'eau jeté dans la rue bouchera le caniveau. Quand il pleut, l'eau ne peut plus partir et la rue inonde. Un sachet dans une poubelle, c'est une rue plus propre !",
    emoji: "🌊",
    audioFr:
      "Un sachet jeté dans la rue bouchera le caniveau et fera une inondation.",
    ordre: 3,
    palier: "comprehension",
  },
  {
    id: "dec-4",
    themeId: "dechets",
    titre: "Le marché et ses déchets",
    contenu:
      "Au marché, il y a des feuilles, des épluchures, des cartons et des sachets. Les déchets organiques peuvent devenir de l'engrais pour le jardin du quartier.",
    emoji: "🧺",
    audioFr:
      "Les déchets organiques du marché peuvent devenir de l'engrais pour le jardin.",
    ordre: 4,
    palier: "comprehension",
  },
  {
    id: "dec-5",
    themeId: "dechets",
    titre: "Le plastique a plusieurs vies",
    contenu:
      "Une bouteille en plastique peut devenir un arrosoir, une pelle, un banc. On dit qu'on la recycle. Trier, c'est donner une seconde vie aux objets.",
    emoji: "🧴",
    audioFr:
      "Trier le plastique, c'est lui donner une seconde vie. On appelle ça recycler.",
    ordre: 5,
    palier: "application",
  },
  {
    id: "dec-6",
    themeId: "dechets",
    titre: "Déchets dangereux : attention !",
    contenu:
      "Les piles, les médicaments et les vieux téléphones ne se jettent jamais dans la nature. Ils empoisonnent la terre et l'eau. On les apporte à un point de collecte.",
    emoji: "🔋",
    audioFr:
      "Les piles et les vieux téléphones empoisonnent la terre. On les apporte à un point de collecte.",
    ordre: 6,
    palier: "maitrise",
  },

  /* --------------------------- EAU --------------------------- */
  {
    id: "eau-1",
    themeId: "eau",
    titre: "L'eau est précieuse",
    contenu:
      "L'eau sert à boire, à cuisiner, à se laver et à arroser le jardin. L'eau propre n'est pas infinie : il faut en prendre soin.",
    emoji: "💧",
    audioFr:
      "L'eau sert à boire, à cuisiner et à se laver. L'eau propre n'est pas infinie.",
    ordre: 1,
    palier: "decouverte",
  },
  {
    id: "eau-2",
    themeId: "eau",
    titre: "Je ferme le robinet",
    contenu:
      "Pendant que je me brosse les dents, je ferme le robinet. Un robinet ouvert, c'est des dizaines de bidons d'eau perdus !",
    emoji: "🚰",
    audioFr:
      "Pendant que je me brosse les dents, je ferme le robinet pour ne pas gaspiller.",
    ordre: 2,
    palier: "decouverte",
  },
  {
    id: "eau-3",
    themeId: "eau",
    titre: "Une fuite, ça se signale",
    contenu:
      "Goutte après goutte, une fuite remplit une bassine entière en une nuit. Si tu vois une fuite à la maison ou à l'école, préviens un adulte tout de suite.",
    emoji: "🩹",
    audioFr:
      "Une fuite remplit une bassine en une nuit. Préviens un adulte tout de suite.",
    ordre: 3,
    palier: "comprehension",
  },
  {
    id: "eau-4",
    themeId: "eau",
    titre: "La bassine maline",
    contenu:
      "Au lieu de laisser couler l'eau, on remplit une bassine : on en utilise beaucoup moins et on garde de l'eau pour le linge et les plantes.",
    emoji: "🪣",
    audioFr:
      "Remplir une bassine, c'est utiliser moins d'eau qu'un robinet qui coule.",
    ordre: 4,
    palier: "comprehension",
  },
  {
    id: "eau-5",
    themeId: "eau",
    titre: "Protéger la rivière et la lagune",
    contenu:
      "On ne jette rien dans la rivière ni dans la lagune : ni sachet, ni huile, ni produit. L'eau polluée rend malades les poissons et les familles qui la boivent.",
    emoji: "🐟",
    audioFr:
      "On ne jette rien dans la lagune. L'eau polluée rend malades les poissons et les familles.",
    ordre: 5,
    palier: "application",
  },
  {
    id: "eau-6",
    themeId: "eau",
    titre: "Récupérer l'eau de pluie",
    contenu:
      "En saison des pluies, on peut récupérer l'eau du toit dans un bidon pour arroser le jardin et laver la cour. C'est de l'eau gratuite pour toute la famille !",
    emoji: "🌧️",
    audioFr:
      "On peut récupérer l'eau de pluie dans un bidon pour arroser le jardin.",
    ordre: 6,
    palier: "maitrise",
  },

  /* ---------------------- BIODIVERSITÉ ---------------------- */
  {
    id: "bio-1",
    themeId: "biodiversite",
    titre: "Beaucoup d'animaux autour de nous",
    contenu:
      "Il y a des animaux dans la savane, dans la forêt, dans la lagune et même dans le jardin. Chaque animal a sa maison : on l'appelle son habitat.",
    emoji: "🦒",
    audioFr:
      "Chaque animal a sa maison. On l'appelle son habitat.",
    ordre: 1,
    palier: "decouverte",
  },
  {
    id: "bio-2",
    themeId: "biodiversite",
    titre: "Le baobab, l'arbre géant",
    contenu:
      "Le baobab vit longtemps et stocke l'eau dans son tronc. Ses fruits donnent une boisson pleine de vitamines : c'est un arbre trésor de la savane.",
    emoji: "🌳",
    audioFr:
      "Le baobab stocke l'eau dans son tronc et ses fruits donnent une boisson pleine de vitamines.",
    ordre: 2,
    palier: "decouverte",
  },
  {
    id: "bio-3",
    themeId: "biodiversite",
    titre: "La tortue marine revient à la plage",
    contenu:
      "La tortue marine pond ses œufs sur le sable. Si la plage est pleine de sachets, elle ne peut plus creuser. Une plage propre sauve des bébés tortues !",
    emoji: "🐢",
    audioFr:
      "La tortue marine pond sur le sable. Une plage propre sauve des bébés tortues.",
    ordre: 3,
    palier: "comprehension",
  },
  {
    id: "bio-4",
    themeId: "biodiversite",
    titre: "La mangrove, gardienne de la lagune",
    contenu:
      "Les palétuviers de la mangrove protègent la côte et abritent des poissons et des oiseaux. Couper la mangrove, c'est perdre la nurserie de la lagune.",
    emoji: "🌿",
    audioFr:
      "La mangrove protège la côte et abrite les petits poissons.",
    ordre: 4,
    palier: "comprehension",
  },
  {
    id: "bio-5",
    themeId: "biodiversite",
    titre: "Le papillon et les fleurs",
    contenu:
      "Le papillon butine les fleurs et transporte le pollen : sans lui, les mangues et les papayes ne poussent pas. Les insectes sont des amis du jardin.",
    emoji: "🦋",
    audioFr:
      "Le papillon transporte le pollen. Sans lui, les fruits ne poussent pas.",
    ordre: 5,
    palier: "application",
  },
  {
    id: "bio-6",
    themeId: "biodiversite",
    titre: "Protéger, c'est comprendre",
    contenu:
      "L'éléphant traverse la savane et sème des graines. Le chimpanzé habite la forêt. Protéger leur habitat, c'est protéger toute la chaîne de la vie, de l'insecte au grand arbre.",
    emoji: "🐘",
    audioFr:
      "Protéger l'habitat des animaux, c'est protéger toute la chaîne de la vie.",
    ordre: 6,
    palier: "maitrise",
  },

  /* ------------------------ ÉNERGIE ------------------------- */
  {
    id: "ene-1",
    themeId: "energie",
    titre: "J'éteins la lumière",
    contenu:
      "Quand je quitte une pièce, j'éteins la lumière. Le jour, la lumière du soleil éclaire la maison gratuitement !",
    emoji: "💡",
    audioFr:
      "Quand je quitte une pièce, j'éteins la lumière.",
    ordre: 1,
    palier: "decouverte",
  },
  {
    id: "ene-2",
    themeId: "energie",
    titre: "Le soleil est notre ami",
    contenu:
      "Un panneau solaire change la lumière du soleil en électricité. Sur beaucoup de toits, le soleil fait marcher les lampes et les téléphones.",
    emoji: "🔆",
    audioFr:
      "Un panneau solaire change la lumière du soleil en électricité.",
    ordre: 2,
    palier: "decouverte",
  },
  {
    id: "ene-3",
    themeId: "energie",
    titre: "La télé qui regarde toute seule",
    contenu:
      "Une télé allumée sans personne devant, ça gaspille. On l'éteint avec le bouton, pas seulement avec la télécommande.",
    emoji: "📺",
    audioFr:
      "Une télé allumée sans personne devant, ça gaspille de l'énergie.",
    ordre: 3,
    palier: "comprehension",
  },
  {
    id: "ene-4",
    themeId: "energie",
    titre: "Le frigo ouvert",
    contenu:
      "Le réfrigérateur ouvert trop longtemps perd son froid et travaille beaucoup plus. On choisit vite, puis on referme bien la porte.",
    emoji: "🧊",
    audioFr:
      "Le frigo ouvert perd son froid. On choisit vite et on referme.",
    ordre: 4,
    palier: "comprehension",
  },
  {
    id: "ene-5",
    themeId: "energie",
    titre: "Le ventilateur et la fenêtre",
    contenu:
      "Un ventilateur qui tourne fenêtre ouverte brasse de l'air chaud. On ferme la fenêtre, ou on éteint et on aère la nuit quand il fait frais.",
    emoji: "🌀",
    audioFr:
      "On n'ouvre pas la fenêtre quand le ventilateur tourne.",
    ordre: 5,
    palier: "application",
  },
  {
    id: "ene-6",
    themeId: "energie",
    titre: "Le quartier qui économise",
    contenu:
      "Si chaque famille éteint une lampe inutile, tout le quartier économise de l'argent et d'énergie. Et l'argent économisé peut servir à l'école !",
    emoji: "🏘️",
    audioFr:
      "Si chaque famille éteint une lampe inutile, tout le quartier économise.",
    ordre: 6,
    palier: "maitrise",
  },
];

/**
 * EcoLangues — vocabulaire écologique.
 * Les traductions locales sont fournies en Dioula et restent marquées
 * « à valider » tant qu'elles n'ont pas été vérifiées par des locuteurs natifs.
 */
export const VOCAB: VocabContent[] = [
  {
    id: "voc-1",
    lessonId: "eau-1",
    themeId: "eau",
    motFr: "l'eau",
    phraseFr: "Je ferme le robinet pour ne pas gaspiller l'eau.",
    dioula: "ji",
    baoule: null,
    emoji: "💧",
    statut: "a_valider",
  },
  {
    id: "voc-2",
    lessonId: "dec-1",
    themeId: "dechets",
    motFr: "la bouteille",
    phraseFr: "Je trie la bouteille dans la poubelle jaune.",
    dioula: "bɔtolo",
    baoule: null,
    emoji: "🧴",
    statut: "a_valider",
  },
  {
    id: "voc-3",
    lessonId: "bio-2",
    themeId: "biodiversite",
    motFr: "l'arbre",
    phraseFr: "Le baobab est un grand arbre de la savane.",
    dioula: "yiri",
    baoule: null,
    emoji: "🌳",
    statut: "a_valider",
  },
  {
    id: "voc-4",
    lessonId: "ene-2",
    themeId: "energie",
    motFr: "le soleil",
    phraseFr: "Le soleil éclaire la maison le jour.",
    dioula: "tile",
    baoule: null,
    emoji: "☀️",
    statut: "a_valider",
  },
  {
    id: "voc-5",
    lessonId: "bio-1",
    themeId: "biodiversite",
    motFr: "l'animal",
    phraseFr: "Chaque animal a son habitat.",
    dioula: "bagan",
    baoule: null,
    emoji: "🐘",
    statut: "a_valider",
  },
  {
    id: "voc-6",
    lessonId: "dec-2",
    themeId: "dechets",
    motFr: "la poubelle",
    phraseFr: "Je mets le sachet dans la poubelle.",
    dioula: "poubelle kegini",
    baoule: null,
    emoji: "🗑️",
    statut: "a_valider",
  },
  {
    id: "voc-7",
    lessonId: "eau-4",
    themeId: "eau",
    motFr: "la bassine",
    phraseFr: "Je remplis la bassine pour laver le linge.",
    dioula: "basini",
    baoule: null,
    emoji: "🪣",
    statut: "a_valider",
  },
  {
    id: "voc-8",
    lessonId: "ene-1",
    themeId: "energie",
    motFr: "la lumière",
    phraseFr: "J'éteins la lumière en sortant.",
    dioula: "laɲini",
    baoule: null,
    emoji: "💡",
    statut: "a_valider",
  },
  {
    id: "voc-9",
    lessonId: "bio-3",
    themeId: "biodiversite",
    motFr: "le poisson",
    phraseFr: "Les poissons vivent dans la lagune.",
    dioula: "jɛgɛ",
    baoule: null,
    emoji: "🐟",
    statut: "a_valider",
  },
  {
    id: "voc-10",
    lessonId: "dec-4",
    themeId: "dechets",
    motFr: "le marché",
    phraseFr: "Au marché, on trie les déchets.",
    dioula: "maraka",
    baoule: null,
    emoji: "🧺",
    statut: "a_valider",
  },
  {
    id: "voc-11",
    lessonId: null,
    themeId: "eau",
    motFr: "la rivière",
    phraseFr: "On ne jette rien dans la rivière.",
    dioula: "ba",
    baoule: null,
    emoji: "🏞️",
    statut: "a_valider",
  },
  {
    id: "voc-12",
    lessonId: null,
    themeId: "biodiversite",
    motFr: "la forêt",
    phraseFr: "Le chimpanzé habite dans la forêt.",
    dioula: "kulo",
    baoule: null,
    emoji: "🌲",
    statut: "a_valider",
  },
  {
    id: "voc-13",
    lessonId: null,
    themeId: "dechets",
    motFr: "propre",
    phraseFr: "Je garde ma rue propre.",
    dioula: "saniya",
    baoule: null,
    emoji: "✨",
    statut: "a_valider",
  },
  {
    id: "voc-14",
    lessonId: null,
    themeId: "energie",
    motFr: "la maison",
    phraseFr: "Dans la maison, on éteint les lampes.",
    dioula: "so",
    baoule: null,
    emoji: "��",
    statut: "a_valider",
  },
];

export const ACTIONS_HORS_ECRAN: OffScreenAction[] = [
  {
    themeId: "dechets",
    palier: "decouverte",
    texte: "Va jeter un déchet qui traîne dans la bonne poubelle, puis reviens !",
  },
  {
    themeId: "dechets",
    palier: "comprehension",
    texte:
      "Compte avec un adulte le nombre de sachets plastiques dans ta cour. Où vont-ils ?",
  },
  {
    themeId: "dechets",
    palier: "application",
    texte:
      "Prépare à la maison deux poubelles : une pour les épluchures, une pour le plastique.",
  },
  {
    themeId: "dechets",
    palier: "maitrise",
    texte:
      "Demande à un voisin où l'on peut apporter les piles usées de ta maison.",
  },
  {
    themeId: "eau",
    palier: "decouverte",
    texte: "Va vérifier si un robinet de la maison est bien fermé.",
  },
  {
    themeId: "eau",
    palier: "comprehension",
    texte:
      "Demande à un adulte de te montrer le compteur ou le robinet principal de la maison.",
  },
  {
    themeId: "eau",
    palier: "application",
    texte:
      "Remplis une bassine pour te laver les mains au lieu de laisser couler l'eau.",
  },
  {
    themeId: "eau",
    palier: "maitrise",
    texte:
      "Repère avec un adulte un point d'eau du quartier (puits, robinet public). Est-il propre ?",
  },
  {
    themeId: "biodiversite",
    palier: "decouverte",
    texte: "Va dehors et trouve trois choses vivantes : une plante, un animal, un arbre.",
  },
  {
    themeId: "biodiversite",
    palier: "comprehension",
    texte: "Observe un arbre pendant une minute : combien d'animaux y vivent ?",
  },
  {
    themeId: "biodiversite",
    palier: "application",
    texte: "Arrose une plante avec l'eau de rinçage du riz ou des légumes.",
  },
  {
    themeId: "biodiversite",
    palier: "maitrise",
    texte:
      "Demande à un parent le nom d'une plante de ton quartier dans ta langue, et dessine-la.",
  },
  {
    themeId: "energie",
    palier: "decouverte",
    texte: "Va éteindre une lumière qui sert à rien dans la maison.",
  },
  {
    themeId: "energie",
    palier: "comprehension",
    texte:
      "Cherche dans ta maison trois appareils branchés mais éteints. Débranche-en un avec un adulte.",
  },
  {
    themeId: "energie",
    palier: "application",
    texte:
      "Repère sur ton toit ou celui d'un voisin s'il y a un panneau solaire. À quoi sert-il ?",
  },
  {
    themeId: "energie",
    palier: "maitrise",
    texte:
      "Propose à ta famille un défi : une soirée avec une seule lampe allumée.",
  },
];

export const PAUSE_ACTIVITIES = [
  "Va regarder dehors et trouve quelque chose de vert !",
  "Fais 5 sauts comme Kofi pour te dégourdir les jambes !",
  "Va boire un grand verre d'eau, comme Awa avant l'école !",
  "Ferme les yeux et écoute : combien de bruits différents entends-tu ?",
  "Va dire à quelqu'un que tu l'aimes. C'est bon pour le cœur !",
];
