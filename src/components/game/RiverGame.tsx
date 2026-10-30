"use client";

import { useRef, useState } from "react";

import { ListenButton } from "@/components/ui";
import { BACS } from "@/content/village";
import type { BacId, Complexite, ObjetATrier } from "@/content/types";
import type { ResultatObjet } from "@/lib/game/rules";
import { playTone, speak } from "@/lib/audio";

import { BulleRetour, dedans, Etiquette, useConsigneDite, useGlisser, usePartie, useScene } from "./commun";

/** Rives et lit de la rivière dans le décor (en % de l'image). */
const RIVE_GAUCHE = [0, 0, 34, 100] as const;
const RIVE_DROITE = [66, 0, 100, 100] as const;
const LIT = [32, 0, 69, 100] as const;

/**
 * « La rivière qui coule » : des radeaux descendent la rivière, chacun porte
 * un geste. L'enfant pousse chaque radeau vers la bonne rive (verte : bon
 * geste ; grise : mauvais geste). Un radeau oublié refait un tour, rien ne
 * se perd. À chaque bonne réponse, l'eau devient plus claire.
 */
export function RiverGame({
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
  const { ref, h, zone } = useScene();
  const partie = usePartie(objets, onFinish);
  const [choisi, setChoisi] = useState<string | null>(null);
  const [tenu, setTenu] = useState<string | null>(null);
  const [survol, setSurvol] = useState<BacId | null>(null);
  const [vague, setVague] = useState<{ x: number; y: number; cle: number } | null>(null);
  const compteur = useRef(0);
  const radeaux = useRef<Record<string, HTMLButtonElement | null>>({});
  const rives = useRef<Partial<Record<BacId, HTMLButtonElement | null>>>({});
  useConsigneDite(consigne);

  const [gauche, droite] = bacs;
  const progres = partie.ranges.length / objets.length;
  const lit = zone(...LIT);
  // Le tour d'un radeau fait la hauteur de la scène : chacun est presque
  // toujours visible. La taille garantit qu'ils ne se chevauchent pas.
  const taille = Math.round(Math.min(lit.width * 0.95, h * 0.18, 140, h / (objets.length * 1.15 - 1)));
  const cycle = h + taille;
  const vitesse = h / (complexite === "petit" ? 16 : 12);
  const duree = cycle / vitesse;
  const objetChoisi = partie.restants.find((o) => o.id === choisi) ?? null;
  const aide = partie.aidePour(objetChoisi);

  const repondre = (o: ObjetATrier, bac: BacId, el?: HTMLElement | null) => {
    const r = el?.getBoundingClientRect();
    const s = ref.current?.getBoundingClientRect();
    if (partie.repondre(o, bac)) {
      if (r && s) setVague({ x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top, cle: ++compteur.current });
      setChoisi(null);
    } else {
      setChoisi(o.id);
      if (el) {
        el.style.transition = "transform 220ms ease-out";
        el.style.transform = "";
      }
    }
  };

  const glisser = useGlisser<ObjetATrier>({
    cible: (x, y) => bacs.find((b) => dedans(rives.current[b]?.getBoundingClientRect(), x, y, 0)) ?? null,
    onLacher: (o, bac, el) => repondre(o, bac, el),
    onToucher: (o) => {
      setChoisi(o.id);
      playTone("pop");
      speak(o.nom);
    },
    onSurvol: setSurvol,
    onPrendre: (o) => setChoisi(o.id),
  });

  /** Sans radeau choisi, toucher une rive prend le radeau le plus visible. */
  const radeauVisible = () => {
    const s = ref.current?.getBoundingClientRect();
    if (!s) return partie.restants[0] ?? null;
    let meilleur: ObjetATrier | null = null;
    let ecart = Infinity;
    for (const o of partie.restants) {
      const r = radeaux.current[o.id]?.getBoundingClientRect();
      if (!r) continue;
      const d = Math.abs(r.top + r.height / 2 - (s.top + s.height / 2));
      if (d < ecart) {
        ecart = d;
        meilleur = o;
      }
    }
    return meilleur;
  };

  const ranges = (bac: BacId) => objets.filter((o) => partie.ranges.includes(o.id) && o.bac === bac);
  const tailleQuai = Math.round(Math.min(zone(...RIVE_GAUCHE).width * 0.62, 72));

  return (
    <div className="flex min-h-[calc(100dvh-88px)] flex-col">
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 font-display text-xl leading-tight">{consigne}</p>
        <ListenButton texte={consigne} />
      </div>

      <div ref={ref} className="relative mt-3 min-h-[440px] flex-1 select-none">
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] border-4 border-white shadow-[0_6px_0_rgba(45,42,38,0.1)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- décor local */}
          <img src={scene} alt="" className="h-full w-full object-cover" draggable={false} />
          {/* L'eau s'éclaircit à chaque bonne réponse. */}
          <div
            className="absolute transition-opacity duration-700"
            style={{
              ...lit,
              background: "linear-gradient(to right, transparent, rgba(92,64,30,0.42) 18%, rgba(92,64,30,0.42) 82%, transparent)",
              mixBlendMode: "multiply",
              opacity: 1 - progres,
            }}
          />
          <div
            className="absolute transition-opacity duration-700"
            style={{
              ...lit,
              background: "linear-gradient(to right, transparent, rgba(40,150,215,0.8) 22%, rgba(40,150,215,0.8) 78%, transparent)",
              mixBlendMode: "color",
              opacity: progres * 0.7,
            }}
          />
          {vague ? (
            <span
              key={vague.cle}
              className="anim-vague pointer-events-none absolute rounded-full border-4 border-white/80"
              style={{ left: vague.x - 30, top: vague.y - 30, width: 60, height: 60 }}
            />
          ) : null}
        </div>

        <p
          className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-3 py-1 font-display text-lg shadow"
          aria-label={`${partie.restants.length} radeau${partie.restants.length > 1 ? "x" : ""} à pousser`}
        >
          {partie.ranges.length} / {objets.length}
        </p>

        {/* Les deux rives : zones de réponse */}
        {[gauche, droite].map((id, i) => {
          const z = i === 0 ? zone(...RIVE_GAUCHE) : zone(...RIVE_DROITE);
          const bac = BACS[id];
          return (
            <button
              key={id}
              ref={(el) => {
                rives.current[id] = el;
              }}
              type="button"
              onClick={() => {
                const o = objetChoisi ?? radeauVisible();
                if (o) repondre(o, id, radeaux.current[o.id]);
              }}
              className={`absolute z-10 flex flex-col items-center rounded-[1.5rem] pt-14 transition-colors ${
                survol === id ? "bg-white/30 ring-4 ring-white" : ""
              } ${aide === id ? "anim-glow bg-ng-sun-soft/40" : ""}`}
              style={z}
              aria-label={`Mettre « ${objetChoisi?.nom ?? "le radeau"} » : ${bac.nom}`}
            >
              <Etiquette texte={bac.nom} couleur={bac.couleurFoncee} className="mx-1 text-xs sm:text-sm" />
              {/* Radeaux déjà arrivés sur cette rive */}
              {ranges(id).map((o, k) => (
                // eslint-disable-next-line @next/next/no-img-element -- radeau dessiné local
                <img
                  key={o.id}
                  src={o.image}
                  alt=""
                  draggable={false}
                  className="anim-pop pointer-events-none absolute"
                  style={{
                    width: tailleQuai,
                    left: z.width / 2 - tailleQuai / 2 + (k % 2 ? 6 : -6),
                    top: 96 + k * Math.min(tailleQuai * 0.8, (z.height - 140) / 6),
                    transform: `rotate(${k % 2 ? 6 : -6}deg)`,
                    filter: "drop-shadow(0 3px 2px rgba(0,0,0,0.3))",
                  }}
                />
              ))}
            </button>
          );
        })}

        {/* Les radeaux qui descendent la rivière (coupés au bord de la scène) */}
        <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-[2rem]">
        {partie.restants.map((o) => {
          const i = objets.indexOf(o);
          const actif = choisi === o.id;
          const arrete = actif || tenu === o.id;
          return (
            <div
              key={o.id}
              className="anim-flotte pointer-events-auto absolute left-0 top-0"
              style={
                {
                  "--de": `${-taille}px`,
                  "--a": `${cycle - taille}px`,
                  "--repos": `${(i / objets.length) * (h - taille * 0.7)}px`,
                  left: lit.left + lit.width / 2 - taille / 2,
                  zIndex: tenu === o.id ? 60 : 30,
                  animationDuration: `${duree}s`,
                  animationDelay: `${(-i * duree) / objets.length}s`,
                  animationPlayState: arrete ? "paused" : "running",
                } as React.CSSProperties
              }
            >
              <div className={arrete ? "" : "anim-tangue"} style={{ animationDelay: `${-i * 0.7}s` }}>
                <button
                  ref={(el) => {
                    radeaux.current[o.id] = el;
                  }}
                  type="button"
                  {...glisser.props(o)}
                  onPointerDown={(e) => {
                    setTenu(o.id);
                    glisser.props(o).onPointerDown(e);
                  }}
                  onPointerUp={(e) => {
                    setTenu(null);
                    glisser.props(o).onPointerUp(e);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setChoisi(o.id);
                      speak(o.nom);
                    }
                  }}
                  aria-pressed={actif}
                  aria-label={`${o.nom}. Glisse-le vers la bonne rive, ou touche-le puis touche une rive.`}
                  className="block cursor-grab touch-none active:cursor-grabbing"
                  style={{ width: taille, height: taille }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- radeau dessiné local */}
                  <img
                    src={o.image}
                    alt=""
                    draggable={false}
                    className="pointer-events-none h-full w-full object-contain"
                    style={{
                      filter: actif
                        ? "drop-shadow(0 0 3px #fff) drop-shadow(0 0 9px rgba(255,196,40,0.95))"
                        : "drop-shadow(0 4px 3px rgba(20,40,60,0.35))",
                    }}
                  />
                </button>
              </div>
            </div>
          );
        })}
        </div>

        {objetChoisi && !partie.retour ? (
          <p className="pointer-events-none absolute left-3 top-3 z-20 max-w-[60%] truncate rounded-full bg-white/90 px-3 py-1 font-display text-base shadow">
            {partie.premierGeste ? "👆 " : ""}
            {objetChoisi.nom}
          </p>
        ) : null}

        <BulleRetour retour={partie.retour} />
      </div>
    </div>
  );
}
