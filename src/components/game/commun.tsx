"use client";

import { useEffect, useRef, useState } from "react";

import { Mascot } from "@/components/ui";
import type { BacId, ObjetATrier } from "@/content/types";
import { pointsObjet, type ResultatObjet } from "@/lib/game/rules";
import { playTone, speak } from "@/lib/audio";

/* Briques communes aux mini-jeux des mondes (Rivière, Forêt, Énergie). */

const BRAVOS = ["Bravo !", "Super !", "Bien joué !", "Excellent !", "Tu as trouvé !"];
/** Après deux essais sur un même élément, la bonne réponse est montrée. */
export const ESSAIS_AVANT_AIDE = 2;

export type Retour =
  | { type: "bon"; titre: string; texte: string; cle: number }
  | { type: "erreur"; texte: string; cle: number };

/** Taille des décors (portrait 3:4), produits par scripts/prepare-illustrations.mjs. */
const DECOR = { w: 896, h: 1200 };

/**
 * Mesure la scène et convertit une position du décor (en % de l'image) en
 * pixels de la scène, l'image étant affichée en « object-cover ».
 */
export function useScene() {
  const ref = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mesurer = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    mesurer();
    const obs = new ResizeObserver(mesurer);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const w = dims?.w ?? 340;
  const h = dims?.h ?? 460;
  const echelle = Math.max(w / DECOR.w, h / DECOR.h);
  const dx = (w - DECOR.w * echelle) / 2;
  const dy = (h - DECOR.h * echelle) / 2;
  /** Position dans la scène (px) d'un point du décor donné en % de l'image. */
  const placer = (x: number, y: number) => ({ x: dx + (x / 100) * DECOR.w * echelle, y: dy + (y / 100) * DECOR.h * echelle });
  /** Rectangle du décor (en %) converti en px et borné à la scène visible. */
  const zone = (x0: number, y0: number, x1: number, y1: number) => {
    const a = placer(x0, y0);
    const b = placer(x1, y1);
    const left = Math.max(0, a.x);
    const top = Math.max(0, a.y);
    return { left, top, width: Math.min(w, b.x) - left, height: Math.min(h, b.y) - top };
  };
  return { ref, w, h, placer, zone };
}

/**
 * Suit une partie : essais par élément, résultats, bulles de Kofi et Awa.
 * `repondre` renvoie true si l'élément va bien là ; la fin de partie
 * appelle `onFinish` après un court moment.
 */
export function usePartie(objets: ObjetATrier[], onFinish: (resultats: ResultatObjet[]) => void) {
  const [ranges, setRanges] = useState<string[]>([]);
  const [essais, setEssais] = useState<Record<string, number>>({});
  const [retour, setRetour] = useState<Retour | null>(null);
  const resultats = useRef<ResultatObjet[]>([]);
  const compteur = useRef(0);
  const fini = useRef(false);

  useEffect(() => {
    if (!retour) return;
    const t = window.setTimeout(() => setRetour(null), retour.type === "bon" ? 3200 : 4500);
    return () => window.clearTimeout(t);
  }, [retour]);

  const restants = objets.filter((o) => !ranges.includes(o.id));

  const repondre = (o: ObjetATrier, bac: BacId): boolean => {
    if (ranges.includes(o.id)) return false;
    const tentative = (essais[o.id] ?? 0) + 1;
    setEssais((e) => ({ ...e, [o.id]: tentative }));
    if (bac !== o.bac) {
      playTone("bad");
      const texte =
        tentative >= ESSAIS_AVANT_AIDE ? `${o.indice} Regarde ce qui brille !` : `${o.indice} Essaie encore !`;
      setRetour({ type: "erreur", texte, cle: ++compteur.current });
      speak(`Presque ! ${texte}`);
      return false;
    }
    resultats.current = [...resultats.current, { objetId: o.id, competence: o.competence, essais: tentative }];
    const suite = [...ranges, o.id];
    setRanges(suite);
    playTone("good");
    const titre =
      tentative === 1 ? BRAVOS[resultats.current.length % BRAVOS.length] : "Tu n'as pas abandonné, bravo !";
    setRetour({ type: "bon", titre, texte: o.pourquoi, cle: ++compteur.current });
    speak(`${titre} ${o.pourquoi}`);
    if (suite.length === objets.length && !fini.current) {
      fini.current = true;
      window.setTimeout(() => {
        playTone("win");
        onFinish(resultats.current);
      }, 1600);
    }
    return true;
  };

  /** Bac à faire briller : celui de l'élément après deux erreurs. */
  const aidePour = (o: ObjetATrier | null | undefined) =>
    o && (essais[o.id] ?? 0) >= ESSAIS_AVANT_AIDE ? o.bac : null;

  return {
    ranges,
    restants,
    essais,
    retour,
    repondre,
    aidePour,
    points: (o: ObjetATrier) => pointsObjet(essais[o.id] ?? 1),
    premierGeste: ranges.length === 0 && Object.keys(essais).length === 0,
  };
}

/** Bulle de Kofi (bravo) ou d'Awa (indice), en haut de la scène : ne bloque pas le jeu. */
export function BulleRetour({ retour }: { retour: Retour | null }) {
  return (
    <div aria-live="polite" className="pointer-events-none absolute inset-x-2 top-2 z-[70]">
      {retour?.type === "bon" ? (
        <div key={retour.cle} className="anim-pop flex items-center gap-2 rounded-3xl border-4 border-ng-leaf bg-ng-leaf-soft p-2 pr-3">
          <Mascot id="kofi" size={56} humeur="joie" />
          <p className="min-w-0 font-display text-base leading-snug">
            <span className="text-ng-green-dark">{retour.titre} </span>
            {retour.texte}
          </p>
        </div>
      ) : retour?.type === "erreur" ? (
        <div key={retour.cle} className="anim-pop flex items-center gap-2 rounded-3xl border-4 border-ng-yellow bg-ng-sun-soft p-2 pr-3">
          <Mascot id="awa" size={56} humeur="indice" />
          <p className="min-w-0 font-display text-base leading-snug">
            <span className="text-ng-yellow-dark">Presque ! </span>
            {retour.texte}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Étiquette d'une zone de réponse (rive, habitat, position du levier). */
export function Etiquette({ texte, couleur, className = "" }: { texte: string; couleur: string; className?: string }) {
  return (
    <span
      className={`pointer-events-none inline-block max-w-full rounded-2xl border-2 bg-white/95 px-2.5 py-0.5 text-center font-display text-sm leading-tight shadow ${className}`}
      style={{ color: couleur, borderColor: couleur }}
    >
      {texte}
    </span>
  );
}

/** En-tête commun : consigne lue à voix haute au début. */
export function useConsigneDite(consigne: string) {
  useEffect(() => {
    const t = window.setTimeout(() => speak(consigne), 600);
    return () => window.clearTimeout(t);
  }, [consigne]);
}

/**
 * Glisser au doigt ou à la souris : `cible(x, y)` dit sur quelle réponse on
 * lâche ; un simple toucher appelle `onToucher`. L'élément suit le doigt
 * via une transformation CSS directe (sans re-rendu).
 */
export function useGlisser<T>({
  cible,
  onLacher,
  onToucher,
  onSurvol,
  onPrendre,
}: {
  cible: (x: number, y: number) => BacId | null;
  onLacher: (item: T, bac: BacId, el: HTMLElement) => void;
  onToucher: (item: T) => void;
  onSurvol: (bac: BacId | null) => void;
  onPrendre?: (item: T) => void;
}) {
  const glisse = useRef<{ x: number; y: number; id: number; item: T; bouge: boolean; survol: BacId | null } | null>(null);
  const remettre = (el: HTMLElement) => {
    el.style.transition = "transform 200ms ease-out";
    el.style.transform = "";
  };
  return {
    remettre,
    props: (item: T) => ({
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.style.transition = "none";
        glisse.current = { x: e.clientX, y: e.clientY, id: e.pointerId, item, bouge: false, survol: null };
      },
      onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
        const g = glisse.current;
        if (!g || g.id !== e.pointerId) return;
        const dx = e.clientX - g.x;
        const dy = e.clientY - g.y;
        if (!g.bouge && Math.hypot(dx, dy) > 8) {
          g.bouge = true;
          onPrendre?.(item);
        }
        if (!g.bouge) return;
        e.currentTarget.style.transform = `translate(${dx}px, ${dy}px) scale(1.12) rotate(${dx / 25}deg)`;
        const dessous = cible(e.clientX, e.clientY);
        if (dessous !== g.survol) {
          g.survol = dessous;
          onSurvol(dessous);
        }
      },
      onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
        const g = glisse.current;
        glisse.current = null;
        if (!g || g.id !== e.pointerId) return;
        onSurvol(null);
        const el = e.currentTarget;
        if (!g.bouge) {
          remettre(el);
          onToucher(item);
          return;
        }
        const dessous = cible(e.clientX, e.clientY);
        if (dessous) onLacher(item, dessous, el);
        else remettre(el);
      },
      onPointerCancel: (e: React.PointerEvent<HTMLElement>) => {
        glisse.current = null;
        onSurvol(null);
        remettre(e.currentTarget);
      },
    }),
  };
}

/** Rectangle écran sous le doigt ? (avec une petite marge). */
export function dedans(r: DOMRect | undefined, x: number, y: number, marge = 8) {
  return Boolean(r && x >= r.left - marge && x <= r.right + marge && y >= r.top - marge && y <= r.bottom + marge);
}
