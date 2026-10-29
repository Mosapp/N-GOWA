"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { Bin } from "@/components/art/Bin";
import { ListenButton, Mascot } from "@/components/ui";
import { BACS } from "@/content/village";
import type { BacId, Complexite, ObjetATrier } from "@/content/types";
import { pointsObjet, type ResultatObjet } from "@/lib/game/rules";
import { playTone, speak } from "@/lib/audio";

const BRAVOS = ["Bravo !", "Super !", "Bien joué !", "Excellent !", "Tu as trouvé !"];
/** Après deux essais sur un même déchet, le bon bac brille pour aider l'enfant. */
const ESSAIS_AVANT_AIDE = 2;
/** Durée du vol du déchet vers la poubelle. */
const DUREE_ENVOL = 450;

type Retour =
  | { type: "bon"; titre: string; texte: string; cle: number }
  | { type: "erreur"; texte: string; cle: number };

/**
 * Place les déchets sur la moitié basse de la scène, en rangées un peu
 * désordonnées (comme s'ils traînaient par terre). Déterministe : la même
 * liste donne toujours la même disposition. `auSol` : décor vide dont le sol
 * occupe le bas de l'image, les objets y sont posés plus bas.
 */
function positions(n: number, auSol: boolean): { x: number; y: number; angle: number }[] {
  const colonnes = n <= 3 ? n : n <= 6 ? 3 : 4;
  const rangees = Math.ceil(n / colonnes);
  const [haut, bas] = auSol ? [58, 86] : [44, 82];
  return Array.from({ length: n }, (_, i) => {
    const rangee = Math.floor(i / colonnes);
    const dansRangee = rangee === rangees - 1 ? n - rangee * colonnes : colonnes;
    const col = i % colonnes;
    const decalX = Math.sin(i * 12.9898) * 4;
    const decalY = Math.cos(i * 78.233) * 3;
    return {
      x: ((col + 0.5) / dansRangee) * 80 + 10 + decalX,
      y: (rangees === 1 ? (haut + bas) / 2 : haut + (rangee / (rangees - 1)) * (bas - haut)) + decalY,
      angle: Math.round(Math.sin(i * 4.1) * 14),
    };
  });
}

/**
 * Mini-jeu « Ramasse les déchets et mets-les dans la bonne poubelle ».
 * - les déchets traînent dans la scène : l'enfant attrape celui qu'il veut ;
 * - glisser-déposer au doigt ou à la souris jusqu'à la poubelle ;
 * - ou toucher un déchet puis une poubelle (plus simple pour les petits, et
 *   accessible au clavier) ;
 * - après une erreur, un indice, et on réessaie autant qu'on veut.
 */
export function SortGame({
  objets,
  bacs,
  complexite,
  consigne,
  scene,
  onFinish,
}: {
  objets: ObjetATrier[];
  bacs: BacId[];
  complexite: Complexite;
  consigne: string;
  scene: string;
  onFinish: (resultats: ResultatObjet[]) => void;
}) {
  const [ranges, setRanges] = useState<string[]>([]);
  const [envols, setEnvols] = useState<Record<string, { dx: number; dy: number }>>({});
  const [choisi, setChoisi] = useState<string | null>(objets[0]?.id ?? null);
  const [essais, setEssais] = useState<Record<string, number>>({});
  const [retour, setRetour] = useState<Retour | null>(null);
  const [survol, setSurvol] = useState<BacId | null>(null);
  const [ouvert, setOuvert] = useState<BacId | null>(null);
  const [gain, setGain] = useState<{ bac: BacId; points: number; cle: number } | null>(null);
  const [secousse, setSecousse] = useState<{ id: string; cle: number } | null>(null);
  const [tenu, setTenu] = useState<string | null>(null);
  const resultats = useRef<ResultatObjet[]>([]);
  const fini = useRef(false);
  const compteur = useRef(0);

  const objetRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const sceneRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  // La taille des objets suit la scène (et non l'écran) : ils restent dedans.
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const mesurer = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    mesurer();
    const obs = new ResizeObserver(mesurer);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const bacRefs = useRef<Partial<Record<BacId, HTMLButtonElement | null>>>({});
  const glisse = useRef<{ x: number; y: number; id: number; objetId: string; bouge: boolean } | null>(null);

  const illustree = objets.every((o) => o.image);
  const [places] = useState(() => positions(objets.length, illustree));
  const restants = objets.filter((o) => !ranges.includes(o.id));
  const enJeu = objets.filter((o) => !ranges.includes(o.id) || envols[o.id]);
  const objetChoisi = restants.find((o) => o.id === choisi) ?? restants[0] ?? null;
  const aide =
    objetChoisi && (essais[objetChoisi.id] ?? 0) >= ESSAIS_AVANT_AIDE ? objetChoisi.bac : null;

  useEffect(() => {
    const t = window.setTimeout(() => speak(consigne), 600);
    return () => window.clearTimeout(t);
  }, [consigne]);

  // Les bulles et les « +points » disparaissent seules : le jeu ne s'arrête pas.
  useEffect(() => {
    if (!retour) return;
    const t = window.setTimeout(() => setRetour(null), retour.type === "bon" ? 3200 : 4500);
    return () => window.clearTimeout(t);
  }, [retour]);
  useEffect(() => {
    if (!gain) return;
    const t = window.setTimeout(() => {
      setGain(null);
      setOuvert(null);
    }, 900);
    return () => window.clearTimeout(t);
  }, [gain]);

  const remettreEnPlace = (id: string) => {
    const el = objetRefs.current[id];
    if (el) {
      el.style.transition = "transform 200ms ease-out";
      el.style.transform = "";
    }
  };

  const selectionner = (o: ObjetATrier) => {
    setChoisi(o.id);
    playTone("pop");
    speak(o.nom);
  };

  const trier = (o: ObjetATrier, bac: BacId) => {
    if (ranges.includes(o.id)) return;
    const tentative = (essais[o.id] ?? 0) + 1;
    setEssais((e) => ({ ...e, [o.id]: tentative }));
    setSurvol(null);

    if (bac !== o.bac) {
      remettreEnPlace(o.id);
      setChoisi(o.id);
      playTone("bad");
      setSecousse({ id: o.id, cle: ++compteur.current });
      const texte =
        tentative >= ESSAIS_AVANT_AIDE
          ? `${o.indice} Regarde la poubelle qui brille !`
          : `${o.indice} Essaie encore !`;
      setRetour({ type: "erreur", texte, cle: ++compteur.current });
      speak(`Presque ! ${texte}`);
      return;
    }

    const points = pointsObjet(tentative);
    resultats.current = [...resultats.current, { objetId: o.id, competence: o.competence, essais: tentative }];

    // Le déchet s'envole dans la poubelle, depuis l'endroit où il a été lâché.
    const el = objetRefs.current[o.id];
    const cible = bacRefs.current[bac]?.getBoundingClientRect();
    const source = el?.getBoundingClientRect();
    if (el && cible && source) {
      const actuel = new DOMMatrixReadOnly(getComputedStyle(el).transform === "none" ? undefined : getComputedStyle(el).transform);
      setEnvols((v) => ({
        ...v,
        [o.id]: {
          dx: actuel.m41 + cible.left + cible.width / 2 - (source.left + source.width / 2),
          dy: actuel.m42 + cible.top + cible.height * 0.3 - (source.top + source.height / 2),
        },
      }));
    }
    const nouveauxRanges = [...ranges, o.id];
    setRanges(nouveauxRanges);
    window.setTimeout(() => {
      setEnvols((v) => {
        const suite = { ...v };
        delete suite[o.id];
        return suite;
      });
    }, DUREE_ENVOL + 50);

    setOuvert(bac);
    setGain({ bac, points, cle: ++compteur.current });
    playTone("good");
    const titre =
      tentative === 1 ? BRAVOS[resultats.current.length % BRAVOS.length] : "Tu n'as pas abandonné, bravo !";
    setRetour({ type: "bon", titre, texte: o.pourquoi, cle: ++compteur.current });
    speak(`${titre} ${o.pourquoi}`);

    const suivant = objets.find((x) => !nouveauxRanges.includes(x.id));
    setChoisi(suivant?.id ?? null);
    if (!suivant && !fini.current) {
      fini.current = true;
      window.setTimeout(() => {
        playTone("win");
        onFinish(resultats.current);
      }, 1600);
    }
  };

  /* -------------------------- glisser-déposer --------------------------- */

  const bacSous = (x: number, y: number): BacId | null => {
    for (const id of bacs) {
      const r = bacRefs.current[id]?.getBoundingClientRect();
      if (r && x >= r.left - 12 && x <= r.right + 12 && y >= r.top - 24 && y <= r.bottom + 12) return id;
    }
    return null;
  };

  const onPointerDown = (o: ObjetATrier, e: ReactPointerEvent<HTMLButtonElement>) => {
    if (ranges.includes(o.id)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    glisse.current = { x: e.clientX, y: e.clientY, id: e.pointerId, objetId: o.id, bouge: false };
    e.currentTarget.style.transition = "none";
  };

  const onPointerMove = (o: ObjetATrier, e: ReactPointerEvent<HTMLButtonElement>) => {
    const g = glisse.current;
    if (!g || g.id !== e.pointerId || g.objetId !== o.id) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.bouge && Math.hypot(dx, dy) > 8) {
      g.bouge = true;
      setTenu(o.id);
      setChoisi(o.id);
      playTone("pop");
    }
    if (!g.bouge) return;
    e.currentTarget.style.transform = `translate(${dx}px, ${dy}px) scale(1.15) rotate(${dx / 25}deg)`;
    const dessous = bacSous(e.clientX, e.clientY);
    if (dessous !== survol) setSurvol(dessous);
  };

  const onPointerUp = (o: ObjetATrier, e: ReactPointerEvent<HTMLButtonElement>) => {
    const g = glisse.current;
    glisse.current = null;
    setTenu(null);
    if (!g || g.id !== e.pointerId) return;
    if (!g.bouge) {
      // Simple toucher : on prend ce déchet et on entend son nom.
      remettreEnPlace(o.id);
      selectionner(o);
      return;
    }
    const dessous = bacSous(e.clientX, e.clientY);
    if (dessous) trier(o, dessous);
    else {
      setSurvol(null);
      remettreEnPlace(o.id);
    }
  };

  const grand = complexite === "grand";
  const tailleBac = bacs.length >= 4 ? 70 : bacs.length === 3 ? 84 : 96;
  const w = dims?.w ?? 340;
  const h = dims?.h ?? 420;
  const borne = (v: number, min: number, max: number) => Math.round(Math.min(max, Math.max(min, v)));
  /** Taille en px d'un objet selon la scène ; les objets dessinés rapetissent au loin. */
  const taille = (o: ObjetATrier, y: number) => {
    if (!o.image) return borne(Math.min(w * 0.17, h * 0.17), 52, objets.length > 6 ? 84 : 94);
    const perspective = 0.78 + ((y - 58) / 28) * 0.3;
    return borne(Math.min(w * 0.22, h * 0.2) * perspective, 50, 130);
  };
  /** Position en px du centre de l'objet, toujours entièrement dans la scène. */
  const centre = (x: number, y: number, t: number) => ({
    left: borne((x / 100) * w, t / 2 + 6, w - t / 2 - 6),
    top: borne((y / 100) * h, t / 2 + 6, h - t / 2 - 8),
  });

  return (
    <div className="flex min-h-[calc(100dvh-88px)] flex-col">
      {/* Consigne et compteur */}
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 font-display text-xl leading-tight">{consigne}</p>
        <ListenButton texte={consigne} />
      </div>

      {/* Scène : les déchets traînent par terre */}
      <div ref={sceneRef} className="relative mt-3 min-h-[300px] flex-1">
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] border-4 border-white shadow-[0_6px_0_rgba(45,42,38,0.1)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- illustration locale de la mission */}
          <img src={scene} alt="" className="h-full w-full object-cover" draggable={false} />
          {illustree ? null : <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/10 to-white/45" />}
        </div>

        <p
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 font-display text-lg shadow"
          aria-label={`${restants.length} déchet${restants.length > 1 ? "s" : ""} à ranger`}
        >
          {objets.length - restants.length} / {objets.length}
        </p>

        {enJeu.map((o) => {
          const i = objets.indexOf(o);
          const place = places[i];
          const envol = envols[o.id];
          const actif = objetChoisi?.id === o.id;
          const secoue = secousse?.id === o.id;
          const t = taille(o, place.y);
          const { left, top } = centre(place.x, place.y, t);
          return (
            <div
              key={o.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left, top, zIndex: tenu === o.id || envol ? 60 : 20 + Math.round(place.y / 4) }}
            >
              <div
                className={o.image ? "" : actif || envol ? "" : "anim-float"}
                style={o.image ? { transform: `rotate(${place.angle}deg)` } : { animationDelay: `${(i % 5) * -0.7}s` }}
              >
                <button
                  key={secoue ? secousse.cle : "repos"}
                  ref={(el) => {
                    objetRefs.current[o.id] = el;
                  }}
                  type="button"
                  disabled={Boolean(envol)}
                  onPointerDown={(e) => onPointerDown(o, e)}
                  onPointerMove={(e) => onPointerMove(o, e)}
                  onPointerUp={(e) => onPointerUp(o, e)}
                  onPointerCancel={() => {
                    glisse.current = null;
                    setTenu(null);
                    setSurvol(null);
                    remettreEnPlace(o.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectionner(o);
                    }
                  }}
                  aria-pressed={actif}
                  aria-label={`${o.nom}. Glisse-le dans une poubelle, ou touche-le puis touche une poubelle.`}
                  className={`flex touch-none select-none items-center justify-center ${
                    o.image
                      ? ""
                      : `rounded-full border-4 bg-white/95 ${
                          actif
                            ? "border-ng-yellow shadow-[0_0_0_5px_rgba(246,180,39,0.35),0_8px_0_rgba(45,42,38,0.18)]"
                            : "border-white shadow-[0_6px_0_rgba(45,42,38,0.18)]"
                        }`
                  } ${secoue ? "anim-shake" : ""} cursor-grab active:cursor-grabbing`}
                  style={{
                    fontSize: t,
                    width: "1em",
                    height: "1em",
                    ...(envol
                      ? {
                          transition: `transform ${DUREE_ENVOL}ms cubic-bezier(.5,-0.3,.7,1), opacity ${DUREE_ENVOL}ms ease-in`,
                          transform: `translate(${envol.dx}px, ${envol.dy}px) scale(0.2)`,
                          opacity: 0,
                        }
                      : null),
                  }}
                >
                  {o.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- objet dessiné local
                    <img
                      src={o.image}
                      alt=""
                      draggable={false}
                      className="pointer-events-none h-full w-full object-contain"
                      style={{
                        filter: actif
                          ? "drop-shadow(0 0 2px #fff) drop-shadow(0 0 7px rgba(255,196,40,0.95))"
                          : "drop-shadow(0 3px 2px rgba(45,30,20,0.3))",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: grand ? "0.56em" : "0.6em", lineHeight: 1 }} aria-hidden>
                      {o.emoji}
                    </span>
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {/* Nom du déchet en main, et petite aide pour le premier geste */}
        {objetChoisi && !retour ? (
          <p className="pointer-events-none absolute left-3 top-3 z-10 max-w-[65%] truncate rounded-full bg-white/90 px-3 py-1 font-display text-lg shadow" aria-hidden>
            {ranges.length === 0 && Object.keys(essais).length === 0 ? "👆 " : ""}
            {objetChoisi.nom}
          </p>
        ) : null}

        {/* Bulle de retour : ne bloque pas le jeu */}
        <div aria-live="polite" className="pointer-events-none absolute inset-x-2 top-2 z-30">
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
      </div>

      {/* Les poubelles */}
      <div
        className="mt-3 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${bacs.length}, minmax(0, 1fr))` }}
      >
        {bacs.map((id) => {
          const bac = BACS[id];
          const actif = survol === id;
          return (
            <button
              key={id}
              ref={(el) => {
                bacRefs.current[id] = el;
              }}
              type="button"
              disabled={!objetChoisi}
              onClick={() => objetChoisi && trier(objetChoisi, id)}
              className={`relative flex flex-col items-center rounded-3xl px-1 pb-2 pt-1 transition-transform ${
                actif ? "scale-110 bg-white" : "bg-white/60"
              } ${aide === id ? "anim-glow bg-ng-sun-soft" : ""}`}
              aria-label={`Mettre « ${objetChoisi?.nom ?? ""} » : ${bac.nom}`}
            >
              <Bin bac={bac} ouvert={actif || ouvert === id} size={tailleBac} />
              <span className="mt-1 text-center font-display text-sm leading-tight" style={{ color: bac.couleurFoncee }}>
                {bac.nom}
              </span>
              {gain?.bac === id ? (
                <span
                  key={gain.cle}
                  className="anim-float-up pointer-events-none absolute -top-2 left-1/2 -ml-6 w-12 rounded-full bg-ng-yellow text-center font-display text-lg"
                  aria-hidden
                >
                  +{gain.points}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
