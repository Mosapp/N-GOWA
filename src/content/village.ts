import type {
  BacContent,
  BacId,
  CompetenceId,
  DefiReelContent,
  MissionContent,
} from "./types";
import { RIVIERE_DEFIS, RIVIERE_MISSIONS } from "./riviere";
import { ZONE_BY_ID } from "./zones";

/* ------------------------------------------------------------------ */
/* Les bacs du Village du Tri                                          */
/* Couleurs cohérentes avec les leçons existantes : jaune = plastique, */
/* bleu = papier, vert = verre, marron = restes / épluchures.          */
/* ------------------------------------------------------------------ */

export const BACS: Record<BacId, BacContent> = {
  plastique: {
    id: "plastique",
    nom: "Plastique",
    couleur: "#F6B427",
    couleurFoncee: "#C98A0E",
    picto: "bouteille",
  },
  papier: {
    id: "papier",
    nom: "Papier",
    couleur: "#1A6FA8",
    couleurFoncee: "#114F7A",
    picto: "feuille-papier",
  },
  verre: {
    id: "verre",
    nom: "Verre",
    couleur: "#237A44",
    couleurFoncee: "#175A31",
    picto: "bocal",
  },
  restes: {
    id: "restes",
    nom: "Épluchures",
    couleur: "#8A5A2B",
    couleurFoncee: "#5E3B1B",
    picto: "epluchure",
  },
  danger: {
    id: "danger",
    nom: "Je donne à un adulte",
    couleur: "#C9432C",
    couleurFoncee: "#9E3220",
    picto: "main",
  },
  reutiliser: {
    id: "reutiliser",
    nom: "Je réutilise",
    couleur: "#7A4BC0",
    couleurFoncee: "#5A3496",
    picto: "boucle",
  },
  trier: {
    id: "trier",
    nom: "Je trie",
    couleur: "#5B6770",
    couleurFoncee: "#3E474E",
    picto: "poubelle",
  },
  // --- Rivière Vivante : panneaux pour classer des gestes ---
  economise: {
    id: "economise",
    nom: "Économise l'eau",
    couleur: "#1A6FA8",
    couleurFoncee: "#114F7A",
    picto: "goutte",
    forme: "panneau",
  },
  gaspille: {
    id: "gaspille",
    nom: "Gaspille l'eau",
    couleur: "#C9432C",
    couleurFoncee: "#9E3220",
    picto: "goutte-barree",
    forme: "panneau",
  },
  protege: {
    id: "protege",
    nom: "Protège la rivière",
    couleur: "#237A44",
    couleurFoncee: "#175A31",
    picto: "poisson",
    forme: "panneau",
  },
  pollue: {
    id: "pollue",
    nom: "Pollue la rivière",
    couleur: "#5B6770",
    couleurFoncee: "#3E474E",
    picto: "nuage-sale",
    forme: "panneau",
  },
  "plantes-oui": {
    id: "plantes-oui",
    nom: "Bonne pour les plantes",
    couleur: "#237A44",
    couleurFoncee: "#175A31",
    picto: "plante",
    forme: "panneau",
  },
  "plantes-non": {
    id: "plantes-non",
    nom: "Pas pour les plantes",
    couleur: "#8A5A2B",
    couleurFoncee: "#5E3B1B",
    picto: "plante-barree",
    forme: "panneau",
  },
};

export const COMPETENCES: Record<CompetenceId, { nom: string; emoji: string }> = {
  "trier-plastique": { nom: "Je reconnais le plastique", emoji: "🧴" },
  "trier-papier": { nom: "Je reconnais le papier et le carton", emoji: "📰" },
  "trier-verre": { nom: "Je reconnais le verre", emoji: "🍾" },
  "trier-restes": { nom: "Je mets les épluchures à part", emoji: "🍌" },
  "reperer-danger": { nom: "Je repère les objets dangereux", emoji: "🔋" },
  reutiliser: { nom: "Je donne une seconde vie aux objets", emoji: "♻️" },
  "economiser-eau": { nom: "Je reconnais les gestes qui économisent l'eau", emoji: "🚰" },
  "proteger-eau": { nom: "Je sais comment protéger la rivière", emoji: "🐟" },
  "reutiliser-eau": { nom: "Je sais quelle eau peut arroser les plantes", emoji: "🌱" },
};

/** Nombre de bonnes réponses du premier coup pour qu'une compétence soit démontrée. */
export const SEUIL_COMPETENCE = 3;

/* ------------------------------------------------------------------ */
/* Missions                                                            */
/* ------------------------------------------------------------------ */

export const VILLAGE_MISSIONS: MissionContent[] = [
  {
    id: "marche-adjoua",
    zoneId: "village-tri",
    ordre: 1,
    titre: "Le marché de Tantie Adjoua",
    personnageId: "adjoua",
    histoire: {
      petit:
        "Au marché, il y a plein de déchets ! Aide Tantie Adjoua à les mettre dans la bonne poubelle.",
      grand:
        "Le marché ferme et les déchets s'entassent près de l'étal de Tantie Adjoua. Si on les trie, on pourra recycler le plastique et faire du compost avec les épluchures !",
    },
    consigne: {
      petit: "Glisse chaque déchet dans la bonne poubelle.",
      grand: "Glisse ou touche la bonne poubelle pour chaque déchet.",
    },
    objectif: {
      japprends: "Reconnaître le plastique, le papier et les épluchures.",
      jepratique: "Mettre chaque déchet dans la bonne poubelle.",
      pourquoi: "Bien trié, un déchet peut être recyclé ou devenir du compost.",
    },
    bacs: { petit: ["plastique", "papier", "restes"], grand: ["plastique", "papier", "restes"] },
    nombreObjets: { petit: 5, grand: 7 },
    objets: [
      {
        id: "sachet-eau",
        nom: "Sachet d'eau vide",
        emoji: "💧",
        bac: "plastique",
        competence: "trier-plastique",
        pourquoi: "Le sachet d'eau est en plastique. Dans la rue, il bouche les caniveaux.",
        indice: "Ce sachet est fin et brillant. Il est fait de plastique.",
      },
      {
        id: "bouteille-plastique",
        nom: "Bouteille de bissap vide",
        emoji: "🧴",
        bac: "plastique",
        competence: "trier-plastique",
        pourquoi: "Cette bouteille est en plastique : triée, elle peut être recyclée.",
        indice: "Appuie dessus : elle se plie. C'est du plastique !",
      },
      {
        id: "sac-marche",
        nom: "Sachet du marché",
        emoji: "🛍️",
        bac: "plastique",
        competence: "trier-plastique",
        pourquoi: "Le sachet est en plastique. Encore mieux : un panier sert tous les jours !",
        indice: "Il est léger et fait de plastique.",
      },
      {
        id: "carton",
        nom: "Carton de la boutique",
        emoji: "📦",
        bac: "papier",
        competence: "trier-papier",
        pourquoi: "Le carton est fait de papier. On peut le recycler en nouveau carton.",
        indice: "Le carton vient du bois des arbres, comme le papier.",
      },
      {
        id: "journal",
        nom: "Vieux journal",
        emoji: "📰",
        bac: "papier",
        competence: "trier-papier",
        pourquoi: "Le journal est du papier : il peut redevenir du papier.",
        indice: "On y lit des nouvelles. Il est fait de papier.",
      },
      {
        id: "peau-banane",
        nom: "Peau de banane",
        emoji: "🍌",
        bac: "restes",
        competence: "trier-restes",
        pourquoi: "La peau de banane pourrit vite : elle peut devenir du compost pour le jardin.",
        indice: "Ça vient d'un fruit. Ça va avec les épluchures.",
      },
      {
        id: "epluchures-igname",
        nom: "Épluchures d'igname",
        emoji: "🍠",
        bac: "restes",
        competence: "trier-restes",
        pourquoi: "Les épluchures nourrissent la terre quand on en fait du compost.",
        indice: "C'est la peau d'un légume. Elle va avec les épluchures.",
      },
      {
        id: "peau-mangue",
        nom: "Peau de mangue",
        emoji: "🥭",
        bac: "restes",
        competence: "trier-restes",
        pourquoi: "Les restes de fruits retournent à la terre grâce au compost.",
        indice: "C'est un reste de fruit.",
        grandsSeulement: true,
      },
      {
        id: "gobelet",
        nom: "Gobelet en plastique",
        emoji: "🥤",
        bac: "plastique",
        competence: "trier-plastique",
        pourquoi: "Ce gobelet est en plastique. Une tasse lavable, c'est encore mieux !",
        indice: "Il est léger et ne se déchire pas comme le papier.",
        grandsSeulement: true,
      },
    ],
    question: {
      question: "Pourquoi met-on les épluchures à part ?",
      reponses: [
        "Pour en faire du compost pour le jardin",
        "Parce qu'elles sont en plastique",
        "Pour les jeter dans le caniveau",
      ],
      bonneReponse: "Pour en faire du compost pour le jardin",
      explication:
        "Les épluchures pourrissent et deviennent un engrais naturel : le compost nourrit les plantes.",
    },
    defiId: "expliquer-tri",
    vignette: "/illustrations/missions/marche-adjoua.webp",
  },
  {
    id: "cour-ecole",
    zoneId: "village-tri",
    ordre: 2,
    titre: "La cour de l'école",
    personnageId: "yao",
    histoire: {
      petit:
        "Maître Yao a besoin de toi ! La cour de l'école est en désordre. On trie ensemble ?",
      grand:
        "Après la récréation, la cour de l'école est pleine de déchets. Maître Yao a installé une nouvelle poubelle verte pour le verre. À toi de trier !",
    },
    consigne: {
      petit: "Glisse chaque déchet dans la bonne poubelle.",
      grand: "Attention, il y a maintenant une poubelle pour le verre !",
    },
    objectif: {
      japprends: "Reconnaître le verre en plus du plastique, du papier et des épluchures.",
      jepratique: "Trier les déchets de l'école dans quatre poubelles.",
      pourquoi: "Le verre bien trié peut être fondu pour fabriquer de nouvelles bouteilles.",
    },
    bacs: {
      petit: ["plastique", "papier", "verre"],
      grand: ["plastique", "papier", "verre", "restes"],
    },
    nombreObjets: { petit: 5, grand: 7 },
    objets: [
      {
        id: "bouteille-verre",
        nom: "Bouteille en verre",
        emoji: "🍾",
        bac: "verre",
        competence: "trier-verre",
        pourquoi: "Le verre peut être fondu et redevenir une bouteille, encore et encore.",
        indice: "Elle est lourde, dure et on voit à travers : c'est du verre.",
      },
      {
        id: "pot-miel",
        nom: "Pot de miel en verre",
        emoji: "🍯",
        bac: "verre",
        competence: "trier-verre",
        pourquoi: "Ce pot est en verre : il va dans la poubelle verte.",
        indice: "Il est dur et transparent comme une vitre.",
      },
      {
        id: "feuille-dessin",
        nom: "Feuille de dessin",
        emoji: "📄",
        bac: "papier",
        competence: "trier-papier",
        pourquoi: "Le papier trié peut devenir un nouveau cahier.",
        indice: "On peut la plier et la déchirer : c'est du papier.",
      },
      {
        id: "cahier-fini",
        nom: "Cahier terminé",
        emoji: "📒",
        bac: "papier",
        competence: "trier-papier",
        pourquoi: "Un cahier terminé, c'est du papier à recycler.",
        indice: "Ses pages sont en papier.",
      },
      {
        id: "emballage-biscuit",
        nom: "Emballage de biscuit",
        emoji: "🍪",
        bac: "plastique",
        competence: "trier-plastique",
        pourquoi: "L'emballage brillant du biscuit est en plastique.",
        indice: "Il fait crr-crr quand on le froisse : c'est du plastique.",
      },
      {
        id: "sachet-eau-ecole",
        nom: "Sachet d'eau vide",
        emoji: "💧",
        bac: "plastique",
        competence: "trier-plastique",
        pourquoi: "Le sachet d'eau est en plastique : il va dans la poubelle jaune.",
        indice: "Il est fin et brillant. C'est du plastique.",
      },
      {
        id: "peau-orange",
        nom: "Peau d'orange",
        emoji: "🍊",
        bac: "restes",
        competence: "trier-restes",
        pourquoi: "La peau d'orange peut devenir du compost.",
        indice: "C'est un reste de fruit.",
        grandsSeulement: true,
      },
      {
        id: "reste-riz",
        nom: "Reste de riz",
        emoji: "🍚",
        bac: "restes",
        competence: "trier-restes",
        pourquoi: "Les restes de repas vont avec les épluchures, pour le compost.",
        indice: "C'est un reste de repas.",
        grandsSeulement: true,
      },
      {
        id: "coco",
        nom: "Coque de noix de coco",
        emoji: "🥥",
        bac: "restes",
        competence: "trier-restes",
        pourquoi: "La coque de coco vient d'un arbre : elle retourne à la terre, lentement.",
        indice: "Elle vient d'un fruit de cocotier.",
        grandsSeulement: true,
      },
    ],
    question: {
      question: "Que peut devenir une bouteille en verre bien triée ?",
      reponses: [
        "Une nouvelle bouteille en verre",
        "Une banane",
        "Rien du tout",
      ],
      bonneReponse: "Une nouvelle bouteille en verre",
      explication:
        "Dans une usine de recyclage, le verre est fondu puis moulé pour faire de nouvelles bouteilles.",
    },
    defiId: "ranger-espace",
    vignette: "/illustrations/missions/cour-ecole.webp",
  },
  {
    id: "seconde-vie",
    zoneId: "village-tri",
    ordre: 3,
    titre: "La seconde vie des objets",
    personnageId: "akissi",
    histoire: {
      petit:
        "Mamie Akissi ne jette presque rien ! Certains objets peuvent encore servir. Aide-la à choisir.",
      grand:
        "Mamie Akissi est couturière. Avec un vieux pagne, elle fait un sac ; avec un bocal, une boîte à épices. Le meilleur déchet, c'est celui qu'on ne produit pas !",
    },
    consigne: {
      petit: "Cet objet peut-il encore servir ? Glisse-le au bon endroit.",
      grand: "Réutiliser ou trier ? Glisse chaque objet au bon endroit.",
    },
    objectif: {
      japprends: "Certains objets peuvent encore servir avant de devenir des déchets.",
      jepratique: "Choisir entre réutiliser un objet et le trier.",
      pourquoi: "Réutiliser, c'est moins de déchets dans le quartier.",
    },
    bacs: { petit: ["reutiliser", "trier"], grand: ["reutiliser", "trier"] },
    nombreObjets: { petit: 5, grand: 7 },
    objets: [
      {
        id: "bocal",
        nom: "Bocal en verre propre",
        emoji: "🍯",
        bac: "reutiliser",
        competence: "reutiliser",
        pourquoi: "Bien lavé, le bocal peut garder du sel, des épices ou des perles.",
        indice: "Il n'est pas cassé. Il peut encore servir de boîte !",
      },
      {
        id: "pagne",
        nom: "Vieux pagne",
        emoji: "👗",
        bac: "reutiliser",
        competence: "reutiliser",
        pourquoi: "Avec un vieux pagne, on peut coudre un sac ou faire un chiffon.",
        indice: "Le tissu est encore solide. Mamie Akissi sait quoi en faire !",
      },
      {
        id: "carton-jouets",
        nom: "Boîte en carton solide",
        emoji: "📦",
        bac: "reutiliser",
        competence: "reutiliser",
        pourquoi: "Une boîte solide peut ranger les jouets ou les crayons.",
        indice: "Elle n'est pas abîmée. Elle peut encore ranger des choses.",
      },
      {
        id: "cahier-moitie",
        nom: "Cahier à moitié rempli",
        emoji: "📒",
        bac: "reutiliser",
        competence: "reutiliser",
        pourquoi: "Les pages blanches peuvent servir de brouillon ou pour dessiner.",
        indice: "Il reste plein de pages blanches !",
      },
      {
        id: "bidon",
        nom: "Bidon vide et lavé",
        emoji: "🛢️",
        bac: "reutiliser",
        competence: "reutiliser",
        pourquoi: "Un bidon lavé peut garder l'eau de pluie pour arroser le jardin.",
        indice: "Il est solide. Il peut garder de l'eau pour les plantes.",
        grandsSeulement: true,
      },
      {
        id: "sachet-dechire",
        nom: "Sachet d'eau déchiré",
        emoji: "💧",
        bac: "trier",
        competence: "trier-plastique",
        pourquoi: "Un sachet déchiré ne peut plus servir : on le trie avec le plastique.",
        indice: "Il est troué. Il ne peut plus rien garder.",
      },
      {
        id: "peau-banane-sv",
        nom: "Peau de banane",
        emoji: "🍌",
        bac: "trier",
        competence: "trier-restes",
        pourquoi: "La peau de banane ne se réutilise pas, mais elle va au compost.",
        indice: "On ne peut pas la réutiliser. Elle va avec les épluchures.",
      },
      {
        id: "journal-mouille",
        nom: "Journal tout mouillé",
        emoji: "📰",
        bac: "trier",
        competence: "trier-papier",
        pourquoi: "Mouillé et abîmé, ce journal se trie avec le papier.",
        indice: "Il est trempé et se déchire. Il ne peut plus servir.",
        grandsSeulement: true,
      },
      {
        id: "gobelet-casse",
        nom: "Gobelet en plastique fendu",
        emoji: "🥤",
        bac: "trier",
        competence: "trier-plastique",
        pourquoi: "Fendu, il fuit : on le trie avec le plastique.",
        indice: "Il est cassé : l'eau coulerait.",
        grandsSeulement: true,
      },
    ],
    question: {
      question: "Réutiliser un objet, ça veut dire…",
      reponses: [
        "Lui trouver une nouvelle utilité",
        "Le jeter dans la rue",
        "Le casser pour s'amuser",
      ],
      bonneReponse: "Lui trouver une nouvelle utilité",
      explication:
        "Réutiliser, c'est faire servir un objet encore une fois. Il ne devient pas un déchet tout de suite.",
    },
    defiId: "seconde-vie-maison",
    vignette: "/illustrations/missions/seconde-vie.webp",
  },
  {
    id: "objets-dangereux",
    zoneId: "village-tri",
    ordre: 4,
    titre: "Attention, objets dangereux !",
    personnageId: "bamba",
    histoire: {
      petit:
        "Madame Bamba, l'infirmière, a une règle : les piles et les médicaments, on ne les touche pas. On les donne à un adulte !",
      grand:
        "Madame Bamba, l'infirmière du quartier, explique que certains déchets sont dangereux pour la santé et pour la terre : piles, médicaments, objets cassés. Ceux-là, on les confie à un adulte.",
    },
    consigne: {
      petit: "Trouve les objets à donner à un adulte.",
      grand: "Trie les déchets et repère ceux qu'on donne à un adulte.",
    },
    objectif: {
      japprends: "Reconnaître les déchets dangereux : piles, médicaments, objets cassés.",
      jepratique: "Ne pas les toucher seul et les confier à un adulte.",
      pourquoi: "Ces déchets peuvent blesser ou polluer la terre et l'eau.",
    },
    bacs: {
      petit: ["plastique", "restes", "danger"],
      grand: ["plastique", "papier", "restes", "danger"],
    },
    nombreObjets: { petit: 5, grand: 7 },
    objets: [
      {
        id: "pile",
        nom: "Pile usée",
        emoji: "🔋",
        bac: "danger",
        competence: "reperer-danger",
        pourquoi: "Une pile contient des produits qui polluent. Un adulte la rapporte à un point de collecte.",
        indice: "Les piles, on ne joue pas avec : on les donne à un adulte.",
      },
      {
        id: "medicaments",
        nom: "Vieux médicaments",
        emoji: "💊",
        bac: "danger",
        competence: "reperer-danger",
        pourquoi: "On ne touche jamais aux médicaments. Un adulte les rapporte à la pharmacie.",
        indice: "Les médicaments, c'est seulement pour les adultes et les soignants.",
      },
      {
        id: "ampoule-cassee",
        nom: "Ampoule cassée",
        emoji: "💡",
        bac: "danger",
        competence: "reperer-danger",
        pourquoi: "Le verre cassé coupe ! On ne la touche pas et on appelle un adulte.",
        indice: "Elle est cassée et peut couper. Qui doit s'en occuper ?",
      },
      {
        id: "telephone-casse",
        nom: "Téléphone cassé",
        emoji: "📱",
        bac: "danger",
        competence: "reperer-danger",
        pourquoi: "Un téléphone contient une batterie. Un adulte l'apporte à un réparateur ou à la collecte.",
        indice: "Il a une batterie à l'intérieur, comme une pile.",
        grandsSeulement: true,
      },
      {
        id: "bouteille-danger",
        nom: "Bouteille d'eau vide",
        emoji: "🧴",
        bac: "plastique",
        competence: "trier-plastique",
        pourquoi: "Une bouteille d'eau vide n'est pas dangereuse : elle va avec le plastique.",
        indice: "Elle est légère et se plie : c'est du plastique.",
      },
      {
        id: "epluchures-danger",
        nom: "Épluchures de plantain",
        emoji: "🍌",
        bac: "restes",
        competence: "trier-restes",
        pourquoi: "Les épluchures de plantain vont au compost.",
        indice: "C'est la peau d'un fruit. Ça va avec les épluchures.",
      },
      {
        id: "feuilles-marche",
        nom: "Feuilles de légumes",
        emoji: "🥬",
        bac: "restes",
        competence: "trier-restes",
        pourquoi: "Les feuilles abîmées retournent à la terre avec le compost.",
        indice: "Ce sont des restes de légumes.",
      },
      {
        id: "enveloppe",
        nom: "Vieille enveloppe",
        emoji: "✉️",
        bac: "papier",
        competence: "trier-papier",
        pourquoi: "L'enveloppe est en papier : elle va dans la poubelle bleue.",
        indice: "On peut la déchirer : c'est du papier.",
        grandsSeulement: true,
      },
    ],
    question: {
      question: "Tu trouves une pile usée par terre. Que fais-tu ?",
      reponses: [
        "Je préviens un adulte sans jouer avec",
        "Je l'ouvre pour voir dedans",
        "Je la jette dans le caniveau",
      ],
      bonneReponse: "Je préviens un adulte sans jouer avec",
      explication:
        "Une pile peut couler et polluer. L'adulte la rapporte dans un point de collecte.",
    },
    defiId: "piles-maison",
    vignette: "/illustrations/missions/objets-dangereux.webp",
  },
];

/* ------------------------------------------------------------------ */
/* Défis du vrai monde                                                 */
/* Aucun défi ne demande de photo, de vidéo ni de localisation.        */
/* ------------------------------------------------------------------ */

const VILLAGE_DEFIS: DefiReelContent[] = [
  {
    id: "expliquer-tri",
    zoneId: "village-tri",
    titre: "Le petit professeur du tri",
    emoji: "🗣️",
    consigne: {
      petit: "Montre à un adulte où va un sachet d'eau vide.",
      grand: "Explique à un adulte comment trier le plastique, le papier et les épluchures.",
    },
    pourquoi: "Expliquer aide à mieux retenir, et toute la famille apprend avec toi.",
    securite: "Pas besoin de toucher aux poubelles : tu peux simplement expliquer.",
  },
  {
    id: "ranger-espace",
    zoneId: "village-tri",
    titre: "Un coin tout propre",
    emoji: "🧹",
    consigne: {
      petit: "Aide un adulte à ranger un coin de la maison.",
      grand: "Avec un adulte, range un espace (chambre, cour, classe) et trie ce qui traîne.",
    },
    pourquoi: "Un espace rangé et trié, c'est plus agréable et plus sûr pour tout le monde.",
    securite: "Ne touche jamais au verre cassé, aux piles ou aux objets coupants : appelle un adulte.",
  },
  {
    id: "seconde-vie-maison",
    zoneId: "village-tri",
    titre: "Chasseur de seconde vie",
    emoji: "🔁",
    consigne: {
      petit: "Trouve à la maison un objet qui peut encore servir. Montre-le à un adulte.",
      grand: "Trouve un objet qui allait être jeté et propose avec un adulte une nouvelle utilité.",
    },
    pourquoi: "Chaque objet réutilisé, c'est un déchet en moins.",
    securite: "Choisis un objet propre et sans danger (pas de verre cassé).",
  },
  {
    id: "piles-maison",
    zoneId: "village-tri",
    titre: "La boîte à piles",
    emoji: "🔋",
    consigne: {
      petit: "Demande à un adulte où ranger les piles usées de la maison.",
      grand: "Avec un adulte, prévoyez une boîte pour garder les piles usées jusqu'à leur collecte.",
    },
    pourquoi: "Les piles ne doivent pas finir dans la terre ou dans l'eau.",
    securite: "C'est l'adulte qui manipule les piles et les médicaments.",
  },
];

/** Tous les défis du vrai monde, toutes zones confondues. */
export const DEFIS_REELS: DefiReelContent[] = [...VILLAGE_DEFIS, ...RIVIERE_DEFIS];

/** Toutes les missions jouables, toutes zones confondues. */
export const MISSIONS: MissionContent[] = [...VILLAGE_MISSIONS, ...RIVIERE_MISSIONS];

export const DEFI_BY_ID = Object.fromEntries(DEFIS_REELS.map((d) => [d.id, d])) as Record<
  string,
  DefiReelContent
>;

export const MISSION_BY_ID = Object.fromEntries(MISSIONS.map((m) => [m.id, m])) as Record<
  string,
  MissionContent
>;

/** Vignette d'une mission, ou à défaut le décor de sa zone. */
export function vignetteDe(mission: MissionContent): string {
  return mission.vignette ?? ZONE_BY_ID[mission.zoneId].decor;
}
