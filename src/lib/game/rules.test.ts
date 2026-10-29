import { describe, expect, it } from "vitest";

import { PINS } from "@/content/pins";
import { MISSIONS, VILLAGE_MISSIONS } from "@/content/village";
import {
  accepterDefi,
  appliquerResultat,
  BAREME,
  declarerDefi,
  etoilesMission,
  pointsMission,
  pointsTotal,
  remettreDefiAFaire,
  selectionnerObjets,
  statutMission,
  statutZone,
  validerDefi,
  type ResultatMission,
} from "./rules";
import { sauvegardeVide, type Sauvegarde } from "./save";

const NOW = Date.UTC(2026, 9, 29, 10);
const ISO = new Date(NOW).toISOString();

function resultatParfait(missionId: string, objets = 7, question: boolean | null = true): ResultatMission {
  const mission = MISSIONS.find((m) => m.id === missionId)!;
  return {
    missionId,
    objets: mission.objets.slice(0, objets).map((o) => ({
      objetId: o.id,
      competence: o.competence,
      essais: 1,
    })),
    questionReussie: question,
  };
}

function jouer(save: Sauvegarde, res: ResultatMission) {
  return appliquerResultat(save, res, ISO);
}

describe("contenu du Village du Tri", () => {
  it("chaque mission a assez d'objets pour chaque tranche, sur ses propres bacs", () => {
    for (const mission of VILLAGE_MISSIONS) {
      for (const complexite of ["petit", "grand"] as const) {
        const bacs = mission.bacs[complexite];
        const eligibles = mission.objets.filter(
          (o) => bacs.includes(o.bac) && (complexite === "grand" || !o.grandsSeulement),
        );
        expect(eligibles.length).toBeGreaterThanOrEqual(mission.nombreObjets[complexite]);
        for (const bac of bacs) {
          expect(eligibles.some((o) => o.bac === bac)).toBe(true);
        }
      }
      expect(mission.question.reponses).toContain(mission.question.bonneReponse);
    }
  });

  it("la sélection couvre tous les bacs et respecte la tranche d'âge", () => {
    for (const mission of VILLAGE_MISSIONS) {
      for (let graine = 1; graine < 40; graine += 1) {
        const petit = selectionnerObjets(mission, "petit", graine);
        expect(petit).toHaveLength(mission.nombreObjets.petit);
        expect(petit.every((o) => !o.grandsSeulement)).toBe(true);
        expect(new Set(petit.map((o) => o.id)).size).toBe(petit.length);
        for (const bac of mission.bacs.petit) expect(petit.some((o) => o.bac === bac)).toBe(true);

        const grand = selectionnerObjets(mission, "grand", graine);
        expect(grand).toHaveLength(mission.nombreObjets.grand);
        for (const bac of mission.bacs.grand) expect(grand.some((o) => o.bac === bac)).toBe(true);
      }
    }
  });

  it("la même graine donne la même partie", () => {
    const m = VILLAGE_MISSIONS[0];
    expect(selectionnerObjets(m, "grand", 42).map((o) => o.id)).toEqual(
      selectionnerObjets(m, "grand", 42).map((o) => o.id),
    );
  });
});

describe("points et étoiles", () => {
  it("valorise la persévérance sans pénaliser l'erreur", () => {
    const res: ResultatMission = {
      missionId: "marche-adjoua",
      objets: [
        { objetId: "a", competence: "trier-plastique", essais: 1 },
        { objetId: "b", competence: "trier-papier", essais: 2 },
        { objetId: "c", competence: "trier-restes", essais: 4 },
      ],
      questionReussie: false,
    };
    expect(pointsMission(res)).toBe(
      BAREME.premierCoup + BAREME.deuxiemeEssai + BAREME.perseverance + BAREME.missionTerminee,
    );
    expect(etoilesMission(res)).toBe(1);
  });

  it("rejouer n'additionne pas les points : seul le meilleur score compte", () => {
    let save = sauvegardeVide(NOW);
    const parfait = resultatParfait("marche-adjoua");
    const premier = jouer(save, parfait);
    save = premier.save;
    expect(premier.gain).toBe(pointsMission(parfait));
    const second = jouer(save, parfait);
    expect(second.gain).toBe(0);
    expect(pointsTotal(second.save)).toBe(pointsMission(parfait));
    expect(second.save.missions["marche-adjoua"].parties).toBe(2);
  });
});

describe("déblocage des missions et des zones", () => {
  it("les missions s'ouvrent une à une", () => {
    let save = sauvegardeVide(NOW);
    const [m1, m2, m3] = VILLAGE_MISSIONS;
    expect(statutMission(save, m1)).toBe("disponible");
    expect(statutMission(save, m2)).toBe("verrouillee");
    save = jouer(save, resultatParfait(m1.id)).save;
    expect(statutMission(save, m1)).toBe("terminee");
    expect(statutMission(save, m2)).toBe("disponible");
    expect(statutMission(save, m3)).toBe("verrouillee");
  });

  it("seul le Village du Tri est jouable ; les autres zones sont annoncées", () => {
    expect(statutZone("village-tri")).toBe("ouverte");
    expect(statutZone("riviere-vivante")).toBe("bientot");
    expect(statutZone("foret-decouvertes")).toBe("bientot");
    expect(statutZone("royaume-energie")).toBe("bientot");
  });
});

describe("pins", () => {
  it("Éco-Tri s'obtient à 200 points dans le Village", () => {
    let save = sauvegardeVide(NOW);
    const obtenus: string[] = [];
    for (const m of VILLAGE_MISSIONS.slice(0, 2)) {
      const bilan = jouer(save, resultatParfait(m.id));
      save = bilan.save;
      obtenus.push(...bilan.nouveauxPins);
    }
    // 2 missions parfaites = 2 × (7 × 10 + 10 + 20) = 200
    expect(pointsTotal(save)).toBe(200);
    expect(obtenus).toContain("eco-tri");
  });

  it("les pins des zones à venir ne s'obtiennent pas avec des points de tri", () => {
    let save = sauvegardeVide(NOW);
    for (let i = 0; i < 3; i += 1) {
      for (const m of VILLAGE_MISSIONS) save = jouer(save, resultatParfait(m.id, 9)).save;
    }
    expect(save.pins["gardien-eau"]).toBeUndefined();
    expect(save.pins["champion-ngowa"]).toBeUndefined();
  });

  it("Seconde Vie demande la compétence « réutiliser » démontrée", () => {
    let save = sauvegardeVide(NOW);
    const res: ResultatMission = {
      missionId: "seconde-vie",
      objets: [
        { objetId: "bocal", competence: "reutiliser", essais: 1 },
        { objetId: "pagne", competence: "reutiliser", essais: 2 },
        { objetId: "carton", competence: "reutiliser", essais: 1 },
      ],
      questionReussie: null,
    };
    const premier = jouer(save, res);
    expect(premier.nouveauxPins).not.toContain("seconde-vie");
    save = premier.save;
    const second = jouer(save, res);
    expect(second.nouveauxPins).toContain("seconde-vie");
    expect(second.competencesDemontrees).toContain("reutiliser");
  });

  it("chaque pin a une règle vérifiable et des couleurs", () => {
    expect(PINS.length).toBeGreaterThanOrEqual(5);
    for (const pin of PINS) {
      expect(pin.couleur).toMatch(/^#[0-9A-F]{6}$/i);
      expect(pin.commentObtenir.length).toBeGreaterThan(5);
    }
  });
});

describe("défis du vrai monde", () => {
  it("distingue accepté, déclaré par l'enfant et validé par un adulte", () => {
    let save = sauvegardeVide(NOW);
    save = accepterDefi(save, "expliquer-tri", ISO);
    expect(save.defis["expliquer-tri"].statut).toBe("accepte");

    // Impossible de valider un défi qui n'a pas été déclaré.
    expect(validerDefi(save, "expliquer-tri", ISO).save).toBe(save);

    save = declarerDefi(save, "expliquer-tri", ISO);
    expect(save.defis["expliquer-tri"].statut).toBe("declare");
    expect(save.pins["heros-vrai-monde"]).toBeUndefined();

    const { save: validee, nouveauxPins } = validerDefi(save, "expliquer-tri", ISO);
    expect(validee.defis["expliquer-tri"].statut).toBe("valide");
    expect(validee.defis["expliquer-tri"].valideLe).toBe(ISO);
    expect(nouveauxPins).toContain("heros-vrai-monde");
  });

  it("un adulte peut remettre le défi à faire, sans pénalité", () => {
    let save = accepterDefi(sauvegardeVide(NOW), "ranger-espace", ISO);
    save = declarerDefi(save, "ranger-espace", ISO);
    save = remettreDefiAFaire(save, "ranger-espace");
    expect(save.defis["ranger-espace"].statut).toBe("accepte");
    expect(pointsTotal(save)).toBe(0);
  });

  it("les défis ne rapportent pas de points de jeu", () => {
    let save = accepterDefi(sauvegardeVide(NOW), "expliquer-tri", ISO);
    save = declarerDefi(save, "expliquer-tri", ISO);
    save = validerDefi(save, "expliquer-tri", ISO).save;
    expect(pointsTotal(save)).toBe(0);
  });
});
