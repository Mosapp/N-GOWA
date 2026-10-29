import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PINS } from "@/content/pins";
import { DEFI_BY_ID, MISSIONS, VILLAGE_MISSIONS } from "@/content/village";
import {
  accepterDefi,
  appliquerResultat,
  BAREME,
  prochaineMission,
  prochainPin,
  semaine,
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

describe("contenu des missions", () => {
  it("les images des scènes et des objets à ramasser existent dans public/", () => {
    for (const m of MISSIONS) {
      if (m.scene) expect(existsSync(join(process.cwd(), "public", m.scene)), m.scene).toBe(true);
      for (const o of m.objets) {
        if (o.image) expect(existsSync(join(process.cwd(), "public", o.image)), o.image).toBe(true);
      }
    }
    // Chaque monde a son mini-jeu, son décor et des objets dessinés.
    for (const m of MISSIONS) {
      expect(m.jeu, m.id).toBeDefined();
      expect(m.scene, m.id).toBeDefined();
      expect(m.objets.every((o) => o.image), m.id).toBe(true);
    }
  });

  it("chaque mission a sa vignette illustrée, présente dans public/", () => {
    for (const m of MISSIONS) {
      expect(m.vignette, m.id).toBeDefined();
      expect(existsSync(join(process.cwd(), "public", m.vignette!)), m.vignette).toBe(true);
    }
  });

  it("chaque mission a un défi réel et des identifiants uniques", () => {
    const ids = MISSIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of MISSIONS) expect(DEFI_BY_ID[m.defiId]).toBeDefined();
    const objets = MISSIONS.flatMap((m) => m.objets.map((o) => `${m.id}/${o.id}`));
    expect(new Set(objets).size).toBe(objets.length);
  });

  it("chaque mission a assez d'objets pour chaque tranche, sur ses propres bacs", () => {
    for (const mission of MISSIONS) {
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
    for (const mission of MISSIONS) {
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

  it("la Rivière s'ouvre quand le Village est terminé ; les autres zones sont annoncées", () => {
    let save = sauvegardeVide(NOW);
    expect(statutZone(save, "village-tri")).toBe("ouverte");
    expect(statutZone(save, "riviere-vivante")).toBe("verrouillee");
    expect(statutZone(save, "foret-decouvertes")).toBe("verrouillee");
    expect(statutZone(save, "royaume-energie")).toBe("verrouillee");
    for (const m of VILLAGE_MISSIONS) save = jouer(save, resultatParfait(m.id)).save;
    expect(statutZone(save, "riviere-vivante")).toBe("ouverte");
    expect(prochaineMission(save)?.id).toBe("chaque-goutte");
  });

  it("la Forêt s'ouvre après la Rivière, et Ami de la Nature s'y obtient", () => {
    let save = sauvegardeVide(NOW);
    for (const m of MISSIONS.filter((x) => x.zoneId !== "foret-decouvertes")) save = jouer(save, resultatParfait(m.id)).save;
    expect(statutZone(save, "foret-decouvertes")).toBe("ouverte");
    expect(prochaineMission(save)?.id).toBe("qui-vit-ou");
    const obtenus: string[] = [];
    for (const m of MISSIONS.filter((x) => x.zoneId === "foret-decouvertes")) {
      const bilan = jouer(save, resultatParfait(m.id));
      save = bilan.save;
      obtenus.push(...bilan.nouveauxPins);
    }
    expect(obtenus).toContain("ami-nature");
  });

  it("toute l'aventure terminée : Énergie Maligne et Champion N'GOWA, même pour les 4-5 ans", () => {
    let save = sauvegardeVide(NOW);
    const obtenus: string[] = [];
    for (const m of MISSIONS) {
      // Partie « petit » : 5 objets du premier coup, pas de question.
      const bilan = jouer(save, resultatParfait(m.id, 5, null));
      save = bilan.save;
      obtenus.push(...bilan.nouveauxPins);
    }
    expect(statutZone(save, "royaume-energie")).toBe("ouverte");
    expect(obtenus).toEqual(expect.arrayContaining(["eco-tri", "gardien-eau", "ami-nature", "energie-maligne", "champion-ngowa"]));
    expect(prochaineMission(save)).toBeNull();
  });

  it("Gardien de l'Eau s'obtient dans la Rivière Vivante", () => {
    let save = sauvegardeVide(NOW);
    for (const m of VILLAGE_MISSIONS) save = jouer(save, resultatParfait(m.id)).save;
    expect(save.pins["gardien-eau"]).toBeUndefined();
    const obtenus: string[] = [];
    for (const m of MISSIONS.filter((x) => x.zoneId === "riviere-vivante")) {
      const bilan = jouer(save, resultatParfait(m.id));
      save = bilan.save;
      obtenus.push(...bilan.nouveauxPins);
    }
    expect(obtenus).toContain("gardien-eau");
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

  it("les pins des autres zones ne s'obtiennent pas avec des points de tri", () => {
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

describe("tableau de bord", () => {
  it("retient les jours joués sans compteur de série", () => {
    let save = sauvegardeVide(NOW);
    save = jouer(save, resultatParfait("marche-adjoua")).save;
    save = jouer(save, resultatParfait("marche-adjoua")).save;
    expect(save.joursJoues).toHaveLength(1);
    const s = semaine(save, NOW);
    expect(s).toHaveLength(7);
    expect(s.filter((j) => j.joue)).toHaveLength(1);
    expect(s.find((j) => j.aujourdhui)?.joue).toBe(true);
  });

  it("propose la prochaine mission et le prochain pin atteignable", () => {
    let save = sauvegardeVide(NOW);
    expect(prochaineMission(save)?.id).toBe("marche-adjoua");
    expect(prochainPin(save)?.id).toBe("eco-tri");
    for (const m of MISSIONS) save = jouer(save, resultatParfait(m.id)).save;
    expect(prochaineMission(save)).toBeNull();
    expect(["seconde-vie", "heros-vrai-monde"]).toContain(prochainPin(save)?.id);
  });
});
