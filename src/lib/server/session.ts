import { randomBytes, createHmac, timingSafeEqual } from "crypto";

/**
 * Système de "session appareil" pour N'GOWA.
 *
 * Il n'y a pas de compte parent avec mot de passe : chaque profil enfant est
 * rattaché à l'appareil (navigateur) qui l'a créé, via un cookie httpOnly
 * signé. Cela empêche un inconnu d'accéder à un profil simplement en devinant
 * son identifiant numérique dans l'URL — il lui faudrait aussi le cookie,
 * qui n'existe que sur l'appareil d'origine et ne peut pas être forgé sans
 * connaître SESSION_SECRET (variable d'environnement côté serveur).
 */

const COOKIE_NAME = "ngowa_device";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET est requis (variable d'environnement) pour sécuriser les sessions.",
    );
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function parseCookies(request: Request): Record<string, string> {
  const header = request.headers.get("cookie") ?? "";
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (!key) continue;
    out[key] = decodeURIComponent(rest.join("="));
  }
  return out;
}

/**
 * Lit le deviceId depuis le cookie de la requête, s'il est présent et que sa
 * signature est valide. Retourne null sinon (nouvel appareil, ou cookie
 * invalide/expiré/forgé).
 */
export function readDeviceId(request: Request): string | null {
  const cookies = parseCookies(request);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return null;
  const [deviceId, signature] = raw.split(".");
  if (!deviceId || !signature) return null;
  const expected = sign(deviceId);
  if (!safeEqual(signature, expected)) return null;
  return deviceId;
}

/**
 * Garantit un deviceId pour la requête courante : le lit s'il existe déjà et
 * est valide, sinon en génère un nouveau. Retourne le deviceId à utiliser et
 * un en-tête Set-Cookie à poser sur la réponse SEULEMENT si un nouveau
 * deviceId a été créé (sinon null, pour ne pas renvoyer le cookie à chaque
 * requête inutilement).
 */
export function ensureDeviceId(request: Request): {
  deviceId: string;
  setCookieHeader: string | null;
} {
  const existing = readDeviceId(request);
  if (existing) return { deviceId: existing, setCookieHeader: null };

  const deviceId = randomBytes(16).toString("hex");
  const signature = sign(deviceId);
  const cookieValue = `${deviceId}.${signature}`;
  const attributes = [
    `${COOKIE_NAME}=${encodeURIComponent(cookieValue)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${ONE_YEAR_SECONDS}`,
  ];
  // "Secure" exige HTTPS : on ne l'ajoute qu'en production (Netlify sert en
  // HTTPS), sinon le cookie ne serait jamais posé en développement local
  // (http://localhost).
  if (process.env.NODE_ENV === "production") attributes.push("Secure");
  const setCookieHeader = attributes.join("; ");

  return { deviceId, setCookieHeader };
}

/**
 * Applique l'en-tête Set-Cookie (s'il existe) à une Response déjà construite,
 * en conservant son corps et son statut d'origine.
 */
export function withDeviceCookie(
  response: Response,
  setCookieHeader: string | null,
): Response {
  if (!setCookieHeader) return response;
  response.headers.append("Set-Cookie", setCookieHeader);
  return response;
}
