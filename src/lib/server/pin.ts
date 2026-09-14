import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Gestion du code PIN parental (4 chiffres), choisi par le parent à la
 * création du profil. Utilisé pour confirmer les actions sensibles
 * (suppression du profil, futur espace parent).
 *
 * On utilise scrypt (intégré à Node.js, aucune dépendance externe à
 * installer — important pour un déploiement Netlify simple) plutôt qu'un
 * stockage en clair ou un simple hash non salé.
 */

const KEY_LENGTH = 64;

export function isValidPinFormat(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{4}$/.test(pin);
}

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(pin, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, derivedHex] = stored.split(":");
  if (!salt || !derivedHex) return false;
  const derived = scryptSync(pin, salt, KEY_LENGTH);
  const expected = Buffer.from(derivedHex, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

/* --------------------------- anti-force-brute ---------------------------- */

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface PinLockState {
  pinFailedAttempts: number;
  pinLockedUntil: Date | null;
}

export function isLocked(state: PinLockState, now = new Date()): boolean {
  return Boolean(state.pinLockedUntil && state.pinLockedUntil > now);
}

/** Calcule le nouvel état après un échec de saisie du PIN. */
export function onFailedAttempt(state: PinLockState, now = new Date()): PinLockState {
  const attempts = state.pinFailedAttempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    return {
      pinFailedAttempts: 0,
      pinLockedUntil: new Date(now.getTime() + LOCK_DURATION_MS),
    };
  }
  return { pinFailedAttempts: attempts, pinLockedUntil: state.pinLockedUntil };
}

export const PIN_MAX_ATTEMPTS = MAX_ATTEMPTS;
export const PIN_LOCK_DURATION_MS = LOCK_DURATION_MS;
