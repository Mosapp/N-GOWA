/**
 * Limitation de débit basique, en mémoire, sans service externe.
 *
 * ⚠️ IMPORTANT (à lire avant de compter dessus) : sur Netlify, chaque route
 * API tourne dans une fonction "serverless" qui peut démarrer une nouvelle
 * instance à tout moment (on ne contrôle pas quand). Cette mémoire n'est
 * donc PAS partagée de façon fiable entre toutes les requêtes : deux
 * requêtes qui arrivent en même temps peuvent atterrir sur deux instances
 * différentes, chacune avec son propre compteur.
 *
 * Résultat concret : ce filtre freine un abus "naïf" (un script qui spamme
 * en boucle depuis une seule connexion), mais n'empêche pas un attaquant
 * déterminé qui répartirait ses requêtes. C'est une première barrière, pas
 * une garantie. Pour une protection fiable, il faudra brancher un service
 * de rate limiting partagé (ex: Upstash Redis, gratuit pour ce volume) —
 * je peux le faire en 15 minutes le jour où tu es prêt à créer ce compte.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Nettoyage périodique pour ne pas faire grossir la mémoire indéfiniment.
function cleanup(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number },
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  if (buckets.size > 5000) cleanup(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }

  if (existing.count >= max) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: max - existing.count };
}

/** Identifiant client best-effort à partir des en-têtes de la requête. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
}
