"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { Bin } from "@/components/art/Bin";
import { Btn, ListenButton, Mascot } from "@/components/ui";
import { IconCheck } from "@/components/icons";
import { BACS } from "@/content/village";
import type { BacId, Complexite, ObjetATrier } from "@/content/types";
import { pointsObjet, type ResultatObjet } from "@/lib/game/rules";
import { playTone, speak } from "@/lib/audio";

const BRAVOS = ["Bravo !", "Super !", "Bien joué !", "Excellent !", "Tu as trouvé !"];
/** Après deux essais, le bon bac brille pour aider l'enfant. */
const ESSAIS_AVANT_AIDE = 2;

type Retour =
  | { type: "bon"; titre: string; texte: string; points: number }
  | { type: "erreur"; texte: string };

/**
 * Mini-jeu « Glisse le déchet dans la bonne poubelle ».
 * - glisser-déposer au doigt ou à la souris ;
 * - ou toucher directement un bac (plus simple pour les petits, et accessible au clavier) ;
 * - après une erreur, un indice, et on réessaie autant qu'on veut.
 */
export function SortGame({
  objets,
  bacs,
  complexite,
  consigne,
  onFinish,
}: {
  objets: ObjetATrier[];
  bacs: BacId[];
  complexite: Complexite;
  consigne: string;
  onFinish: (resultats: ResultatObjet[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [essais, setEssais] = useState(0);
  const [retour, setRetour] = useState<Retour | null>(null);
  const [survol, setSurvol] = useState<BacId | null>(null);
  const [ouvert, setOuvert] = useState<BacId | null>(null);
  const [secousse, setSecousse] = useState(0);
  const [envol, setEnvol] = useState<{ dx: number; dy: number } | null>(null);
  const resultats = useRef<ResultatObjet[]>([]);

  const objetRef = useRef<HTMLButtonElement>(null);
  const bacRefs = useRef<Partial<Record<BacId, HTMLButtonElement | null>>>({});
  const glisse = useRef<{ x: number; y: number; id: number; bouge: boolean } | null>(null);

  const objet = objets[index];
  const termine = retour?.type === "bon";
  const aide = !termine && essais >= ESSAIS_AVANT_AIDE ? objet?.bac : null;

  useEffect(() => {
    if (!objet) return;
    const t = window.setTimeout(() => speak(objet.nom), index === 0 ? 900 : 200);
    return () => window.clearTimeout(t);
  }, [objet, index]);

  const remettreEnPlace = () => {
    if (objetRef.current) {
      objetRef.current.style.transition = "transform 180ms ease-out";
      objetRef.current.style.transform = "";
    }
  };

  const choisir = useCallback(
    (bac: BacId) => {
      if (!objet || termine) return;
      const tentative = essais + 1;
      setEssais(tentative);
      setSurvol(null);

      if (bac === objet.bac) {
        const points = pointsObjet(tentative);
        resultats.current = [
          ...resultats.current,
          { objetId: objet.id, competence: objet.competence, essais: tentative },
        ];
        // L'objet s'envole dans le bac.
        const cible = bacRefs.current[bac]?.getBoundingClientRect();
        const source = objetRef.current?.getBoundingClientRect();
        if (cible && source && objetRef.current) {
          objetRef.current.style.transition = "";
          objetRef.current.style.transform = "";
          setEnvol({
            dx: cible.left + cible.width / 2 - (source.left + source.width / 2),
            dy: cible.top + cible.height * 0.35 - (source.top + source.height / 2),
          });
        }
        setOuvert(bac);
        playTone("good");
        const titre = tentative === 1 ? BRAVOS[index % BRAVOS.length] : "Tu n'as pas abandonné, bravo !";
        setRetour({ type: "bon", titre, texte: objet.pourquoi, points });
        speak(`${titre} ${objet.pourquoi}`);
      } else {
        remettreEnPlace();
        playTone("bad");
        setSecousse((s) => s + 1);
        const texte =
          tentative >= ESSAIS_AVANT_AIDE
            ? `${objet.indice} Regarde la poubelle qui brille !`
            : `${objet.indice} Essaie encore !`;
        setRetour({ type: "erreur", texte });
        speak(`Presque ! ${texte}`);
      }
    },
    [essais, index, objet, termine],
  );

  const suivant = () => {
    setRetour(null);
    setEssais(0);
    setOuvert(null);
    setEnvol(null);
    if (index + 1 >= objets.length) {
      playTone("win");
      onFinish(resultats.current);
    } else {
      setIndex(index + 1);
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

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (termine) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    glisse.current = { x: e.clientX, y: e.clientY, id: e.pointerId, bouge: false };
    if (objetRef.current) objetRef.current.style.transition = "none";
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const g = glisse.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.bouge && Math.hypot(dx, dy) > 8) g.bouge = true;
    if (!g.bouge) return;
    if (objetRef.current) objetRef.current.style.transform = `translate(${dx}px, ${dy}px) scale(0.85) rotate(${dx / 20}deg)`;
    const dessous = bacSous(e.clientX, e.clientY);
    if (dessous !== survol) setSurvol(dessous);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const g = glisse.current;
    glisse.current = null;
    if (!g || g.id !== e.pointerId) return;
    if (!g.bouge) {
      // Simple toucher : on réécoute le nom de l'objet.
      remettreEnPlace();
      if (objet) speak(objet.nom);
      return;
    }
    const dessous = bacSous(e.clientX, e.clientY);
    if (dessous) choisir(dessous);
    else {
      setSurvol(null);
      remettreEnPlace();
    }
  };

  if (!objet) return null;

  const grand = complexite === "grand";
  const tailleBac = bacs.length >= 4 ? 70 : bacs.length === 3 ? 84 : 96;

  return (
    <div className="flex min-h-[calc(100dvh-88px)] flex-col">
      {/* Consigne et progression */}
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 font-display text-xl leading-tight">{consigne}</p>
        <ListenButton texte={consigne} />
      </div>
      <ol className="mt-3 flex flex-wrap gap-1.5" aria-label={`Objet ${index + 1} sur ${objets.length}`}>
        {objets.map((o, i) => (
          <li
            key={o.id}
            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-white ${
              i < index || (i === index && termine)
                ? "border-ng-green bg-ng-green"
                : i === index
                  ? "border-ng-yellow-dark bg-ng-yellow"
                  : "border-ng-ink/15 bg-white"
            }`}
          >
            {i < index || (i === index && termine) ? <IconCheck size={16} strokeWidth={3.5} /> : null}
          </li>
        ))}
      </ol>

      {/* Scène : l'objet à trier */}
      <div className="relative flex flex-1 flex-col items-center justify-center py-4">
        <button
          key={`${objet.id}-${secousse}`}
          ref={objetRef}
          type="button"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            glisse.current = null;
            remettreEnPlace();
            setSurvol(null);
          }}
          className={`relative z-20 flex touch-none select-none flex-col items-center rounded-[2rem] border-4 border-white bg-white px-5 pb-3 pt-4 shadow-[0_10px_0_rgba(45,42,38,0.12)] ${
            secousse && retour?.type === "erreur" ? "anim-shake" : "anim-pop"
          }`}
          style={
            envol
              ? {
                  transition: "transform 420ms cubic-bezier(.5,-0.3,.7,1), opacity 420ms ease-in",
                  transform: `translate(${envol.dx}px, ${envol.dy}px) scale(0.2)`,
                  opacity: 0,
                }
              : undefined
          }
          aria-label={`${objet.nom}. Glisse-le dans une poubelle, ou touche une poubelle.`}
        >
          <span className={grand ? "text-[64px] leading-none" : "text-[80px] leading-none"} aria-hidden>
            {objet.emoji}
          </span>
          <span className="mt-2 max-w-[200px] text-center font-display text-lg leading-tight">{objet.nom}</span>
        </button>
        {!termine && index === 0 && essais === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-sm font-bold text-ng-muted" aria-hidden>
            <span className="anim-float inline-block">👆</span> Glisse vers le bas
          </p>
        ) : null}
      </div>

      {/* Indice après une erreur */}
      <div aria-live="polite" className="min-h-[4.5rem]">
        {retour?.type === "erreur" ? (
          <div className="anim-pop flex items-center gap-3 rounded-3xl border-3 border-ng-yellow bg-ng-sun-soft p-3" style={{ borderWidth: 3 }}>
            <Mascot id="awa" size={64} humeur="indice" />
            <p className="font-display text-base leading-snug">
              <span className="text-ng-yellow-dark">Presque ! </span>
              {retour.texte}
            </p>
          </div>
        ) : null}
      </div>

      {/* Les bacs */}
      <div
        className="mt-2 grid gap-2"
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
              disabled={termine}
              onClick={() => choisir(id)}
              className={`flex flex-col items-center rounded-3xl px-1 pb-2 pt-1 transition-transform ${
                actif ? "scale-105 bg-white" : "bg-white/50"
              } ${aide === id ? "anim-glow bg-ng-sun-soft" : ""}`}
              aria-label={`Mettre « ${objet.nom} » : ${bac.nom}`}
            >
              <Bin bac={bac} ouvert={actif || ouvert === id} size={tailleBac} />
              <span
                className="mt-1 text-center font-display text-sm leading-tight"
                style={{ color: bac.couleurFoncee }}
              >
                {bac.nom}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bonne réponse : explication + suite */}
      {retour?.type === "bon" ? (
        <div
          className="anim-rise fixed inset-x-0 bottom-0 z-30 border-t-4 border-ng-leaf bg-ng-leaf-soft px-4 pb-6 pt-4 safe-bottom"
          role="status"
        >
          <div className="mx-auto flex max-w-xl items-start gap-3">
            <Mascot id="kofi" size={78} humeur="joie" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center justify-between gap-2 font-display text-2xl text-ng-green-dark">
                {retour.titre}
                <span className="anim-pop rounded-full bg-ng-yellow px-3 py-0.5 text-lg text-ng-ink">
                  +{retour.points}
                </span>
              </p>
              <p className="mt-1 text-base font-bold leading-snug text-ng-ink">{retour.texte}</p>
            </div>
          </div>
          <div className="mx-auto mt-3 max-w-xl">
            <Btn size="lg" onClick={suivant} sound="none">
              Continuer
            </Btn>
          </div>
        </div>
      ) : null}
    </div>
  );
}
