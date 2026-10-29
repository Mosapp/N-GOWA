"use client";

import { useRef, useState } from "react";

import { ListenButton } from "@/components/ui";
import { BACS } from "@/content/village";
import type { BacId, Complexite, ObjetATrier } from "@/content/types";
import type { ResultatObjet } from "@/lib/game/rules";
import { playTone, speak } from "@/lib/audio";

import { BulleRetour, dedans, Etiquette, useConsigneDite, useGlisser, usePartie, useScene } from "./commun";

/** Maisons du décor « village la nuit » (en % de l'image) : elles s'allument une à une. */
const LUMIERES: [number, number][] = [
  [25, 41], [34, 38], [52, 37], [57, 43], [66, 41], [76, 34], [84, 40],
  [76, 48], [22, 62], [37, 62], [52, 58], [66, 63], [78, 60],
];
/** Pièces dessinées (px des fichiers, même échelle deux à deux). */
const SOCLE = { w: 240, h: 372 };
const MANCHE = { w: 148, h: 342 };
const BATTERIE = { w: 240, h: 452 };
const ENERGIE = { w: 231, h: 399 };

type Levier = "haut" | "bas" | null;

/**
 * « Le grand interrupteur » : une carte apparaît, l'enfant pousse le levier
 * vers le haut (bon geste) ou vers le bas (gaspillage, danger…). Il peut
 * aussi glisser la carte vers le haut ou le bas, ou toucher une moitié.
 * Chaque bonne réponse remplit la batterie et allume une maison du village.
 */
export function SwitchGame({
  objets,
  bacs,
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
  const { ref, w, h, placer } = useScene();
  const partie = usePartie(objets, onFinish);
  const [levier, setLevier] = useState<Levier>(null);
  const [survol, setSurvol] = useState<BacId | null>(null);
  const [secousse, setSecousse] = useState(0);
  const [envol, setEnvol] = useState<{
    o: ObjetATrier;
    x: number;
    y: number;
    taille: number;
    dx: number;
    dy: number;
    cle: number;
  } | null>(null);
  const [tire, setTire] = useState(false);
  const [mancheDy, setMancheDy] = useState(0);
  const compteur = useRef(0);
  const cibles = useRef<Partial<Record<BacId, HTMLButtonElement | null>>>({});
  const batterieRef = useRef<HTMLDivElement>(null);
  const tireManche = useRef<{ y: number; id: number } | null>(null);
  useConsigneDite(consigne);

  const [haut, bas] = bacs;
  const carte = partie.restants[0] ?? null;
  const aide = partie.aidePour(carte);
  const progres = partie.ranges.length / objets.length;
  const allumees = Math.round(progres * LUMIERES.length);

  // Tailles calculées sur la scène.
  const hauteurSocle = Math.round(Math.min(h * 0.27, 220));
  const echelle = hauteurSocle / SOCLE.h;
  const course = hauteurSocle * 0.2;
  const tailleCarte = Math.round(Math.min(w * 0.58, h * 0.32, 270));
  const largeurBatterie = Math.round(Math.min(w * 0.13, 58));
  const eBatterie = largeurBatterie / BATTERIE.w;

  const repondre = (o: ObjetATrier, bac: BacId, el?: HTMLElement | null) => {
    setLevier(bac === haut ? "haut" : "bas");
    playTone("tap");
    const de = el?.getBoundingClientRect();
    const b = batterieRef.current?.getBoundingClientRect();
    const sc = ref.current?.getBoundingClientRect();
    if (partie.repondre(o, bac)) {
      if (de && b && sc) {
        setEnvol({
          o,
          x: de.left - sc.left,
          y: de.top - sc.top,
          taille: de.width,
          dx: b.left + b.width / 2 - (de.left + de.width / 2),
          dy: b.top + b.height / 2 - (de.top + de.height / 2),
          cle: ++compteur.current,
        });
        window.setTimeout(() => setEnvol(null), 550);
      }
    } else {
      setSecousse((s) => s + 1);
      if (el) {
        el.style.transition = "transform 220ms ease-out";
        el.style.transform = "";
      }
    }
    window.setTimeout(() => setLevier(null), 650);
  };

  const glisser = useGlisser<ObjetATrier>({
    cible: (x, y) => bacs.find((id) => dedans(cibles.current[id]?.getBoundingClientRect(), x, y, 0)) ?? null,
    onLacher: (o, bac, el) => repondre(o, bac, el),
    onToucher: (o) => {
      playTone("pop");
      speak(o.nom);
    },
    onSurvol: setSurvol,
  });

  // Position du manche : au milieu, en haut ou en bas de la fente (ou suit le doigt).
  const decalageManche = tire ? mancheDy : levier === "haut" ? -course : levier === "bas" ? course : 0;

  return (
    <div className="flex min-h-[calc(100dvh-88px)] flex-col">
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 font-display text-xl leading-tight">{consigne}</p>
        <ListenButton texte={consigne} />
      </div>

      <div ref={ref} className="relative mt-3 min-h-[480px] flex-1 select-none">
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] border-4 border-white shadow-[0_6px_0_rgba(45,42,38,0.1)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- décor local */}
          <img src={scene} alt="" className="h-full w-full object-cover" draggable={false} />
          {/* Le village s'allume au fil des bonnes réponses. */}
          {LUMIERES.map(([x, y], i) => {
            const p = placer(x, y);
            const r = Math.max(18, w * 0.07);
            return (
              <span
                key={i}
                className="pointer-events-none absolute rounded-full transition-opacity duration-700"
                style={{
                  left: p.x - r,
                  top: p.y - r,
                  width: r * 2,
                  height: r * 2,
                  background: "radial-gradient(circle, rgba(255,214,120,0.95) 0%, rgba(255,170,60,0.55) 35%, transparent 70%)",
                  mixBlendMode: "screen",
                  opacity: i < allumees ? 1 : 0,
                }}
              />
            );
          })}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-700"
            style={{ background: "linear-gradient(to top, rgba(255,170,70,0.35), transparent 60%)", opacity: progres }}
          />
        </div>

        {/* La batterie : se remplit à chaque bonne réponse */}
        <div
          ref={batterieRef}
          className="absolute left-3 top-3 z-20"
          style={{ width: largeurBatterie, height: BATTERIE.h * eBatterie }}
          aria-label={`Batterie remplie : ${partie.ranges.length} sur ${objets.length}`}
          role="img"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- batterie dessinée */}
          <img src="/illustrations/jeux/batterie.webp" alt="" draggable={false} className="absolute inset-0 h-full w-full" />
          {/* eslint-disable-next-line @next/next/no-img-element -- énergie dessinée */}
          <img
            src="/illustrations/jeux/batterie-energie.webp"
            alt=""
            draggable={false}
            className="absolute left-1/2 -translate-x-1/2 transition-[clip-path] duration-700"
            style={{
              width: ENERGIE.w * eBatterie,
              height: ENERGIE.h * eBatterie,
              top: (BATTERIE.h - ENERGIE.h) * 0.62 * eBatterie,
              clipPath: `inset(${(1 - progres) * 100}% 0 0 0)`,
            }}
          />
        </div>

        <p className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-3 py-1 font-display text-lg shadow">
          {partie.ranges.length} / {objets.length}
        </p>

        {/* Les deux moitiés du bas : levier en haut (bon geste) ou en bas */}
        {[haut, bas].map((id, i) => {
          const bac = BACS[id];
          const hauteur = hauteurSocle + 40;
          return (
            <button
              key={id}
              ref={(el) => {
                cibles.current[id] = el;
              }}
              type="button"
              onClick={() => carte && repondre(carte, id, document.getElementById("carte-active"))}
              className={`absolute inset-x-0 z-10 flex items-center justify-end pr-3 transition-colors ${
                survol === id ? (i === 0 ? "bg-ng-leaf/30" : "bg-ng-red/25") : ""
              } ${aide === id ? "anim-glow bg-ng-sun-soft/40" : ""}`}
              style={{ bottom: i === 0 ? hauteur / 2 : 0, height: hauteur / 2 }}
              aria-label={`Mettre « ${carte?.nom ?? ""} » : ${bac.nom}`}
            >
              <span className="flex max-w-[46%] items-center gap-1">
                <span aria-hidden className="font-display text-xl" style={{ color: bac.couleurFoncee }}>
                  {i === 0 ? "▲" : "▼"}
                </span>
                <Etiquette texte={bac.nom} couleur={bac.couleurFoncee} className="text-xs sm:text-sm" />
              </span>
            </button>
          );
        })}

        {/* Le levier */}
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2"
          style={{ left: "26%", bottom: 20, width: SOCLE.w * echelle, height: hauteurSocle }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- socle du levier */}
          <img src="/illustrations/jeux/levier-socle.webp" alt="" draggable={false} className="absolute inset-0 h-full w-full" />
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            className="pointer-events-auto absolute left-1/2 cursor-grab touch-none active:cursor-grabbing"
            style={{
              width: MANCHE.w * echelle,
              height: MANCHE.h * echelle,
              marginLeft: (-MANCHE.w * echelle) / 2,
              // Le pied du manche est au milieu de la fente.
              bottom: hauteurSocle / 2 - MANCHE.h * echelle * 0.08,
              transform: `translateY(${decalageManche}px)`,
              transition: tire ? "none" : "transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              tireManche.current = { y: e.clientY, id: e.pointerId };
              setTire(true);
              setMancheDy(0);
            }}
            onPointerMove={(e) => {
              const t = tireManche.current;
              if (!t || t.id !== e.pointerId) return;
              setMancheDy(Math.max(-course, Math.min(course, e.clientY - t.y)));
            }}
            onPointerUp={(e) => {
              const t = tireManche.current;
              tireManche.current = null;
              setTire(false);
              if (!t || !carte) return setMancheDy(0);
              const dy = e.clientY - t.y;
              setMancheDy(0);
              const carteEl = document.getElementById("carte-active");
              if (Math.abs(dy) > course * 0.5) repondre(carte, dy < 0 ? haut : bas, carteEl);
              else if (Math.abs(dy) < 6) {
                // Simple toucher : comme toucher la moitié (haut ou bas) sous le doigt.
                const sous = bacs.find((id) => dedans(cibles.current[id]?.getBoundingClientRect(), e.clientX, e.clientY, 0));
                if (sous) repondre(carte, sous, carteEl);
              }
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- manche du levier */}
            <img src="/illustrations/jeux/levier-manche.webp" alt="" draggable={false} className="pointer-events-none h-full w-full" />
          </button>
        </div>

        {/* La pile de cartes : celle du dessus se joue */}
        <div
          className="absolute left-1/2 z-30 -translate-x-1/2"
          style={{ top: Math.max(56, (h - hauteurSocle * 1.45 - 70 - tailleCarte) / 2), width: tailleCarte, height: tailleCarte }}
        >
          {partie.restants
            .slice()
            .reverse()
            .map((o, k, liste) => {
              const dessus = k === liste.length - 1;
              const rang = liste.length - 1 - k;
              return (
                <button
                  key={dessus ? `${o.id}-${secousse}` : o.id}
                  id={dessus ? "carte-active" : undefined}
                  type="button"
                  disabled={!dessus}
                  {...(dessus ? glisser.props(o) : {})}
                  aria-label={`${o.nom}. Glisse-le vers le haut ou vers le bas, ou pousse le levier.`}
                  className={`absolute inset-0 overflow-hidden rounded-[1.4rem] border-[6px] border-white bg-white shadow-[0_8px_0_rgba(0,0,0,0.25)] ${
                    dessus ? `anim-pop cursor-grab touch-none active:cursor-grabbing ${secousse ? "anim-shake" : ""}` : ""
                  }`}
                  style={{ transform: dessus ? undefined : `translate(${rang * 5}px, ${rang * 5}px) rotate(${rang % 2 ? 3 : -3}deg)` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- carte dessinée locale */}
                  <img src={o.image} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />
                </button>
              );
            })}
        </div>

        {carte && !partie.retour ? (
          <p
            className="pointer-events-none absolute inset-x-0 z-30 mx-auto w-fit max-w-[80%] truncate rounded-full bg-white/90 px-3 py-1 text-center font-display text-base shadow"
            style={{ top: Math.max(56, (h - hauteurSocle * 1.45 - 70 - tailleCarte) / 2) + tailleCarte + 10 }}
          >
            {carte.nom}
          </p>
        ) : null}

        {/* La carte bien classée file dans la batterie */}
        {envol ? (
          // eslint-disable-next-line @next/next/no-img-element -- carte dessinée locale
          <img
            key={envol.cle}
            src={envol.o.image}
            alt=""
            className="anim-vers-batterie pointer-events-none absolute z-40 rounded-xl border-4 border-white"
            style={
              {
                left: envol.x,
                top: envol.y,
                width: envol.taille,
                height: envol.taille,
                "--dx": `${envol.dx}px`,
                "--dy": `${envol.dy}px`,
              } as React.CSSProperties
            }
          />
        ) : null}

        <BulleRetour retour={partie.retour} />
      </div>
    </div>
  );
}
