/* Service worker N'GOWA : rend l'application jouable sans connexion.
 *
 * - À l'installation : met en cache la page, ses scripts, ses polices,
 *   les mascottes et les icônes.
 * - Pages : réseau d'abord (pour recevoir les mises à jour), cache sinon.
 * - Fichiers statiques (/_next/static, images, polices) : cache d'abord.
 *
 * Aucune donnée de l'enfant ne passe par ici : la progression est dans
 * le localStorage de l'appareil.
 */

const CACHE = "ngowa-v4";
const ESSENTIELS = [
  "/",
  "/manifest.webmanifest",
  // Illustrations nécessaires pour jouer hors ligne dès la première visite.
  ...["kofi-salue", "kofi-montre", "kofi-bravo", "kofi-reflechit", "awa-salue", "awa-explique", "awa-bravo", "awa-indice"].map(
    (n) => `/illustrations/mascots/${n}.webp`,
  ),
  ...["adjoua", "yao", "akissi", "bamba"].map((n) => `/illustrations/persos/${n}.webp`),
  ...[
    "marche-adjoua", "cour-ecole", "seconde-vie", "objets-dangereux",
    "chaque-goutte", "riviere-propre", "tresor-de-l-eau",
    "qui-vit-ou", "amis-nature", "maison-propre",
    "chasse-gaspillage", "soleil-ami", "electricite-sans-danger",
  ].map((n) => `/illustrations/missions/${n}.webp`),
  ...["accueil", "village-tri", "riviere-vivante", "foret-decouvertes", "royaume-energie", "pause", "kofi-repos", "awa-au-revoir", "coffre", "carte-portrait", "carte-paysage"].map(
    (n) => `/illustrations/decors/${n}.webp`,
  ),
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

async function mettreEnCache(urls) {
  const cache = await caches.open(CACHE);
  await Promise.all(
    urls.map(async (url) => {
      try {
        const reponse = await fetch(url, { cache: "no-cache" });
        if (reponse.ok) await cache.put(url, reponse);
      } catch {
        /* hors ligne pendant l'installation : on réessaiera */
      }
    }),
  );
}

/** Retrouve les scripts et feuilles de style référencés par la page. */
async function ressourcesDeLaPage() {
  try {
    const html = await (await fetch("/", { cache: "no-cache" })).text();
    const urls = new Set();
    for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) urls.add(m[1]);
    return [...urls];
  } catch {
    return [];
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await mettreEnCache(ESSENTIELS);
      await mettreEnCache(await ressourcesDeLaPage());
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const noms = await caches.keys();
      await Promise.all(noms.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "mettre-en-cache" && Array.isArray(event.data.urls)) {
    const urls = event.data.urls.filter(
      (u) => typeof u === "string" && (u.startsWith(self.location.origin) || u.startsWith("/")),
    );
    event.waitUntil(mettreEnCache(urls));
  }
});

function estStatique(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/mascots/") ||
    url.pathname.startsWith("/illustrations/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:woff2?|png|webp|svg|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const controleur = new AbortController();
          const delai = setTimeout(() => controleur.abort(), 4000);
          const reponse = await fetch(req, { signal: controleur.signal });
          clearTimeout(delai);
          if (reponse.ok) cache.put("/", reponse.clone());
          return reponse;
        } catch {
          return (await cache.match("/")) || (await cache.match(req)) || Response.error();
        }
      })(),
    );
    return;
  }

  if (estStatique(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const enCache = await cache.match(req, { ignoreSearch: url.pathname.startsWith("/_next/static/") });
        if (enCache) return enCache;
        try {
          const reponse = await fetch(req);
          if (reponse.ok) cache.put(req, reponse.clone());
          return reponse;
        } catch {
          return Response.error();
        }
      })(),
    );
    return;
  }

  // Autres requêtes (manifest, données RSC…) : réseau puis cache.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const reponse = await fetch(req);
        if (reponse.ok) cache.put(req, reponse.clone());
        return reponse;
      } catch {
        return (await cache.match(req, { ignoreSearch: true })) || Response.error();
      }
    })(),
  );
});
