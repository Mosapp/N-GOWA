// Parcours complet de N'GOWA dans un vrai navigateur (Playwright).
//
// Prérequis : `npm run build && npm run start` (port 3000 par défaut),
// et le paquet `playwright` disponible (npm i -D playwright && npx playwright install chromium).
// Usage : BASE_URL=http://localhost:3000 node scripts/e2e-parcours.mjs
//
// Vérifie : accueil → avatar/surnom → âge → découverte → carte → mission
// (glisser-déposer, erreurs, indices) → question → résultat → défi →
// persistance locale → validation parentale → pin → jeu HORS LIGNE →
// pause et fin de journée → mode 4-5 ans.

import { chromium, devices } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SAVE_KEY = "ngowa.sauvegarde";
let etapes = 0;

function ok(cond, message) {
  if (!cond) throw new Error(`ÉCHEC : ${message}`);
  etapes += 1;
  console.log(`  ✓ ${message}`);
}

async function lireSave(page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), SAVE_KEY);
}

async function creerProfil(page, tranche) {
  await page.goto(BASE);
  await page.getByRole("button", { name: "Commencer l'aventure" }).click();
  await page.getByRole("button", { name: "Tortue" }).click();
  await page.getByRole("button", { name: "Petit Baobab" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: tranche }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Passer" }).click();
  await page.getByRole("heading", { name: /Bonjour/ }).waitFor();
}

/** Joue la partie de tri : essaie les bacs dans l'ordre (donc avec des erreurs). */
async function jouerTri(page, { glisser = true } = {}) {
  let objets = 0;
  let indices = 0;
  for (let garde = 0; garde < 20; garde += 1) {
    const continuer = page.getByRole("button", { name: "Continuer", exact: true });
    const bacs = page.getByRole("button", { name: /^Mettre « / });
    const n = await bacs.count();
    if (!n) break;
    let trouve = false;
    for (let i = 0; i < n && !trouve; i += 1) {
      const bac = bacs.nth(i);
      if (glisser && i === 0) {
        // Vrai glisser-déposer au pointeur.
        const objet = page.getByRole("button", { name: /Glisse-le dans une poubelle/ });
        const a = await objet.boundingBox();
        const b = await bac.boundingBox();
        await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
        await page.mouse.down();
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
        await page.mouse.up();
      } else {
        await bac.click();
      }
      await page.waitForTimeout(150);
      if (await continuer.isVisible().catch(() => false)) trouve = true;
      else if (await page.getByText(/^Presque !/).isVisible().catch(() => false)) indices += 1;
    }
    if (!trouve) throw new Error("aucun bac n'a été accepté");
    objets += 1;
    await continuer.click();
    await page.waitForTimeout(100);
    if (await page.getByRole("button", { name: "Voir mon résultat" }).count()) break;
    if (await page.getByText("Mission réussie !").first().isVisible().catch(() => false)) break;
    if (await page.getByText("La question d'Awa").isVisible().catch(() => false)) break;
  }
  return { objets, indices };
}

async function repondreQuestion(page) {
  const reponses = page.locator("section button.btn-ng");
  const n = await reponses.count();
  for (let i = 0; i < n; i += 1) {
    if (await page.getByRole("button", { name: "Voir mon résultat" }).isVisible().catch(() => false)) break;
    const r = reponses.nth(i);
    if (await r.isEnabled()) await r.click();
    await page.waitForTimeout(100);
  }
  await page.getByRole("button", { name: "Voir mon résultat" }).click();
}

async function lancerMission(page, numero, zone = /^Le Village du Tri/) {
  await page.getByRole("button", { name: zone }).first().click();
  await page.getByRole("button", { name: new RegExp(`^Mission ${numero} :`) }).click();
  await page.getByRole("button", { name: /^(Jouer !|Rejouer)$/ }).click();
  await page.getByRole("button", { name: /prêt/ }).click();
}

const browser = await chromium.launch();
try {
  /* -------------------------- 6-8 ans, parcours -------------------------- */
  console.log("Parcours 6-8 ans");
  const ctx = await browser.newContext({ ...devices["Pixel 5"], hasTouch: false });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));

  await creerProfil(page, /6, 7 ou 8 ans/);
  let save = await lireSave(page);
  ok(save.profil.pseudo === "Petit Baobab" && save.profil.tranche === "6-8", "profil local créé sans compte ni e-mail");
  ok(!JSON.stringify(save).includes("@"), "aucune adresse e-mail stockée");

  await lancerMission(page, 1);
  ok((await page.getByRole("button", { name: /^Mettre « / }).count()) === 3, "mission 1 : trois bacs");
  const partie = await jouerTri(page);
  ok(partie.objets === 7, "7 objets triés (6-10 ans)");
  ok(partie.indices > 0, "des indices bienveillants s'affichent après une erreur");
  await page.getByText("La question d'Awa").waitFor();
  await repondreQuestion(page);
  await page.getByText("Mission réussie !").first().waitFor();
  ok(await page.getByText("trouvés en réessayant").isVisible(), "le résultat distingue premier coup et persévérance");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.getByText("Défi du vrai monde").waitFor();
  await page.getByRole("button", { name: "Je relève le défi !" }).click();
  await page.getByText("Mission 2").first().waitFor();

  save = await lireSave(page);
  ok(save.missions["marche-adjoua"].terminee, "mission enregistrée localement");
  ok(save.defis["expliquer-tri"].statut === "accepte", "défi accepté (pas encore validé)");
  const points = save.missions["marche-adjoua"].meilleursPoints;
  ok(points > 20, `points obtenus : ${points}`);

  await page.reload();
  await page.getByRole("button", { name: "Continuer l'aventure" }).click();
  ok(await page.getByRole("button", { name: /1 missions sur 4 terminées/ }).isVisible(), "progression conservée après rechargement");

  /* ------------------------- défi + validation parent ------------------------- */
  await page.getByRole("navigation", { name: "Navigation", exact: true }).getByRole("button", { name: /^Défis/ }).click();
  await page.getByRole("button", { name: "Je l'ai fait !" }).click();
  save = await lireSave(page);
  ok(save.defis["expliquer-tri"].statut === "declare", "défi déclaré par l'enfant, distinct d'une validation");
  ok(!save.pins["heros-vrai-monde"], "pas de pin avant la validation d'un adulte");
  await page.getByRole("button", { name: "Montrer à un adulte maintenant" }).click();
  const calcul = await page.getByText(/combien font/).textContent();
  const [, a, b] = calcul.match(/(\d+) × (\d+)/);
  await page.getByLabel(/combien font/).fill(String(Number(a) * Number(b)));
  await page.getByLabel("Nouveau code").fill("2468");
  await page.getByLabel("Confirmez le code").fill("2468");
  await page.getByRole("button", { name: "Créer le code" }).click();
  await page.getByRole("button", { name: "Je valide" }).click();
  save = await lireSave(page);
  ok(save.defis["expliquer-tri"].statut === "valide" && save.defis["expliquer-tri"].valideLe, "défi validé par un adulte, avec date");
  ok(save.parent.pinHash && !JSON.stringify(save.parent).includes("2468"), "code parent haché, jamais en clair");
  await page.getByRole("button", { name: "Retour" }).click();
  await page.getByText("Nouveau pin !").waitFor();
  ok(await page.getByRole("heading", { name: "Héros du Vrai Monde" }).isVisible(), "pin « Héros du Vrai Monde » célébré");
  await page.getByRole("button", { name: "Super !" }).click();

  await page.getByRole("navigation", { name: "Navigation", exact: true }).getByRole("button", { name: /^Mes pins/ }).click();
  ok(await page.getByRole("button", { name: "Héros du Vrai Monde, obtenu" }).isVisible(), "pin visible dans la collection");
  ok(await page.getByRole("button", { name: "Gardien de l'Eau, pas encore obtenu" }).isVisible(), "pins futurs affichés comme à obtenir");

  await page.getByRole("button", { name: /Ma fiche de progression/ }).click();
  ok(await page.getByText("validé par un adulte le").isVisible(), "fiche : geste validé par un adulte");
  ok(await page.getByText("ne prouvent pas, à eux seuls").isVisible(), "fiche : les points ne prouvent pas un changement de comportement");
  await page.getByRole("button", { name: "Retour à la carte" }).click();

  /* ------------------------------- hors ligne ------------------------------- */
  console.log("Hors ligne");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(1500);
  await ctx.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Continuer l'aventure" }).click();
  ok(await page.getByRole("button", { name: /1 missions sur 4 terminées/ }).isVisible(), "l'application se recharge sans connexion");
  await page.waitForTimeout(800);
  const imagesCassees = await page.evaluate(() =>
    [...document.images].filter((img) => img.complete && img.naturalWidth === 0 && img.loading !== "lazy").map((img) => img.src),
  );
  ok(imagesCassees.length === 0, `illustrations affichées hors ligne (${imagesCassees.join(", ")})`);
  await lancerMission(page, 2);
  ok((await page.getByRole("button", { name: /^Mettre « / }).count()) === 4, "mission 2 hors ligne : quatre bacs");
  await jouerTri(page, { glisser: false });
  await repondreQuestion(page);
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.getByRole("button", { name: "Plus tard" }).click();
  save = await lireSave(page);
  ok(save.missions["cour-ecole"]?.terminee, "mission jouée et enregistrée entièrement hors ligne");
  const polices = await page.evaluate(() => document.fonts.check("800 20px Baloo_2") || [...document.fonts].some((f) => f.status === "loaded"));
  ok(polices, "polices disponibles hors ligne");
  await ctx.setOffline(false);

  /* ------------------------------ temps d'écran ----------------------------- */
  console.log("Temps d'écran");
  await page.evaluate((k) => {
    const s = JSON.parse(localStorage.getItem(k));
    s.temps.secondesSession = 20 * 60;
    s.temps.secondesJour = 25 * 60;
    s.temps.derniereActivite = Date.now();
    localStorage.setItem(k, JSON.stringify(s));
  }, SAVE_KEY);
  await page.reload();
  await page.getByRole("button", { name: "Continuer l'aventure" }).click();
  await page.getByText("La pause de Kofi").waitFor();
  ok(true, "pause proposée à la fin de la session (20 min pour 6-8 ans)");
  await page.reload();
  await page.getByRole("button", { name: "Continuer l'aventure" }).click();
  ok(await page.getByText("La pause de Kofi").isVisible(), "recharger ne contourne pas la pause");

  await page.evaluate((k) => {
    const s = JSON.parse(localStorage.getItem(k));
    s.temps.pauseDebut = null;
    s.temps.secondesSession = 0;
    s.temps.secondesJour = 40 * 60;
    localStorage.setItem(k, JSON.stringify(s));
  }, SAVE_KEY);
  await page.reload();
  await page.getByRole("button", { name: "Continuer l'aventure" }).click();
  ok(await page.getByRole("heading", { name: "À demain !" }).isVisible(), "fin de journée à 40 min, sans message culpabilisant");
  await page.getByRole("button", { name: "Espace parent" }).click();
  await page.getByLabel("Code parent").fill("2468");
  await page.getByRole("button", { name: "Ouvrir" }).click();
  await page.getByRole("button", { name: /Accorder 10 minutes/ }).click();
  await page.getByRole("button", { name: "Retour" }).click();
  ok(await page.getByRole("button", { name: /^Le Village du Tri/ }).first().isVisible(), "un adulte peut accorder du temps en plus");
  ok(erreurs.length === 0, `aucune erreur JavaScript (${erreurs.join(" | ")})`);
  await ctx.close();

  /* --------------------------------- 4-5 ans -------------------------------- */
  console.log("Parcours 4-5 ans");
  const ctxPetit = await browser.newContext({ ...devices["Pixel 5"] });
  const petit = await ctxPetit.newPage();
  await creerProfil(petit, /4 ou 5 ans/);
  ok(
    await petit.getByRole("button", { name: "La Rivière Vivante : à débloquer" }).first().isVisible(),
    "la Rivière Vivante est à débloquer au départ",
  );
  await lancerMission(petit, 1);
  ok((await petit.getByRole("button", { name: /^Mettre « / }).count()) === 3, "4-5 ans : trois bacs");
  const p = await jouerTri(petit, { glisser: false });
  ok(p.objets === 5, "4-5 ans : 5 objets seulement");
  await petit.getByText("Mission réussie !").first().waitFor();
  ok(true, "4-5 ans : pas de question écrite, résultat direct");
  await ctxPetit.close();

  /* ---------------------------- Rivière Vivante ---------------------------- */
  console.log("Rivière Vivante");
  const ctxRiv = await browser.newContext({ ...devices["Pixel 5"] });
  const riv = await ctxRiv.newPage();
  await creerProfil(riv, /9 ou 10 ans/);
  await riv.evaluate((k) => {
    const s = JSON.parse(localStorage.getItem(k));
    const iso = new Date().toISOString();
    for (const id of ["marche-adjoua", "cour-ecole", "seconde-vie", "objets-dangereux"]) {
      s.missions[id] = { meilleursPoints: 80, meilleuresEtoiles: 2, parties: 1, terminee: true, derniereFois: iso };
    }
    localStorage.setItem(k, JSON.stringify(s));
  }, SAVE_KEY);
  await riv.reload();
  await riv.getByRole("button", { name: "Continuer l'aventure" }).first().click();
  ok(
    await riv.getByRole("button", { name: /^La Rivière Vivante : 0 missions sur 3/ }).first().isVisible(),
    "la Rivière Vivante s'ouvre après le Village",
  );
  await lancerMission(riv, 1, /^La Rivière Vivante/);
  ok(
    (await riv.getByRole("button", { name: /^Mettre « .* : (Économise|Gaspille) l'eau$/ }).count()) === 2,
    "mission eau : deux panneaux (économise / gaspille)",
  );
  const r = await jouerTri(riv, { glisser: true });
  ok(r.objets === 7, "mission eau : 7 gestes classés");
  await riv.getByText("La question d'Awa").waitFor();
  await repondreQuestion(riv);
  await riv.getByRole("button", { name: "Continuer", exact: true }).click();
  ok(await riv.getByRole("heading", { name: /Le robinet bien fermé/ }).isVisible(), "défi réel « robinet bien fermé » proposé");
  await riv.getByRole("button", { name: "Je relève le défi !" }).click();
  const saveRiv = await lireSave(riv);
  ok(saveRiv.missions["chaque-goutte"]?.terminee, "mission de la Rivière enregistrée");
  await ctxRiv.close();

  console.log(`\n${etapes} vérifications réussies.`);
} finally {
  await browser.close();
}
