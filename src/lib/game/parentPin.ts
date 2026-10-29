import type { EspaceParent } from "./save";

/**
 * Code parent local (4 chiffres).
 *
 * Il sert à séparer les actions sensibles (valider un défi, réinitialiser,
 * accorder du temps) de l'espace enfant. Il est haché avec un sel et ne
 * quitte jamais l'appareil. Ce n'est pas une protection contre un adulte
 * malveillant ayant accès à l'appareil.
 */

export const ESSAIS_AVANT_BLOCAGE = 5;
export const DUREE_BLOCAGE_MS = 60 * 1000;

export function pinValide(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

function hexa(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Repli quand Web Crypto n'est pas disponible (page servie hors HTTPS). */
function fnv1a(texte: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let tour = 0; tour < 2000; tour += 1) {
    for (let i = 0; i < texte.length; i += 1) {
      h1 = Math.imul(h1 ^ texte.charCodeAt(i), 16777619);
      h2 = Math.imul(h2 ^ (texte.charCodeAt(i) + tour), 2246822519);
    }
  }
  return `fnv:${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}`;
}

export async function hacherPin(pin: string, sel: string): Promise<string> {
  const entree = `ngowa:${sel}:${pin}`;
  const subtle = typeof crypto !== "undefined" ? crypto.subtle : undefined;
  if (subtle) {
    try {
      const data = new TextEncoder().encode(entree);
      return `sha256:${hexa(await subtle.digest("SHA-256", data))}`;
    } catch {
      /* repli ci-dessous */
    }
  }
  return fnv1a(entree);
}

export function nouveauSel(): string {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function estBloque(parent: EspaceParent, now: number): boolean {
  return parent.bloqueJusqua !== null && now < parent.bloqueJusqua;
}

export async function verifierPin(
  parent: EspaceParent,
  pin: string,
  now: number,
): Promise<{ ok: boolean; parent: EspaceParent }> {
  if (!parent.pinHash || !parent.sel || estBloque(parent, now)) return { ok: false, parent };
  const ok = (await hacherPin(pin, parent.sel)) === parent.pinHash;
  if (ok) return { ok: true, parent: { ...parent, echecs: 0, bloqueJusqua: null } };
  const echecs = parent.echecs + 1;
  return {
    ok: false,
    parent: {
      ...parent,
      echecs: echecs >= ESSAIS_AVANT_BLOCAGE ? 0 : echecs,
      bloqueJusqua: echecs >= ESSAIS_AVANT_BLOCAGE ? now + DUREE_BLOCAGE_MS : null,
    },
  };
}

/** Petite question d'adulte affichée avant de créer le code. */
export function questionAdulte(graine: number): { texte: string; reponse: number } {
  const a = 12 + (graine % 7);
  const b = 3 + (Math.floor(graine / 7) % 6);
  return { texte: `${a} × ${b}`, reponse: a * b };
}
