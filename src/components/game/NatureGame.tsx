"use client";

import { useRef, useState } from "react";

import { ListenButton } from "@/components/ui";
import { BACS } from "@/content/village";
import type { BacId, Complexite, ObjetATrier } from "@/content/types";
import type { ResultatObjet } from "@/lib/game/rules";
import { playTone, speak } from "@/lib/audio";

import { BulleRetour, dedans, Etiquette, useConsigneDite, useGlisser, usePartie, useScene } from "./commun";

/** Zones du décor (en % de l'image) : 4 habitats, ou 2 moitiés de forêt. */
const QUATRE: [number, number, number, number][] = [
  [0, 0, 50, 50],
  [50, 0, 100, 50],
  [0, 50, 50, 100],
  [50, 50, 100, 100],
];
const DEUX: [number, number, number, number][] = [
  [0, 0, 50, 100],
  [50, 0, 100, 100],
];

/**
 * « Les maisons de la nature » : l'enfant prend un animal ou une scène dans
 * son panier et le glisse dans la bonne zone du paysage. Ce qui est bien
 * placé y reste : le paysage se remplit et prend vie.
 */
export function NatureGame({
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
  const { ref, w, zone } = useScene();
  const partie = usePartie(objets, onFinish);
  const [choisi, setChoisi] = useState<string | null>(null);
  const [tenu, setTenu] = useState<string | null>(null);
  const [survol, setSurvol] = useState<BacId | null>(null);
  const [secousse, setSecousse] = useState<{ id: string; cle: number } | null>(null);
  const compteur = useRef(0);
  const zones = useRef<Partial<Record<BacId, HTMLButtonElement | null>>>({});
  useConsigneDite(consigne);

  const rects = bacs.length === 4 ? QUATRE : DEUX;
  const objetChoisi = partie.restants.find((o) => o.id === choisi) ?? partie.restants[0] ?? null;
  const aide = partie.aidePour(objetChoisi);
  const taillePanier = Math.round(Math.min((w - 24) / Math.min(5, Math.max(3, partie.restants.length)), 84));

  const repondre = (o: ObjetATrier, bac: BacId, el?: HTMLElement | null) => {
    if (partie.repondre(o, bac)) {
      setChoisi(null);
    } else {
      setChoisi(o.id);
      setSecousse({ id: o.id, cle: ++compteur.current });
      if (el) {
        el.style.transition = "transform 220ms ease-out";
        el.style.transform = "";
      }
    }
  };

  const glisser = useGlisser<ObjetATrier>({
    cible: (x, y) => bacs.find((b) => dedans(zones.current[b]?.getBoundingClientRect(), x, y, 0)) ?? null,
    onLacher: (o, bac, el) => repondre(o, bac, el),
    onToucher: (o) => {
      setChoisi(o.id);
      playTone("pop");
      speak(o.nom);
    },
    onSurvol: setSurvol,
    onPrendre: (o) => setChoisi(o.id),
  });

  return (
    <div className="flex min-h-[calc(100dvh-88px)] flex-col">
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 font-display text-xl leading-tight">{consigne}</p>
        <ListenButton texte={consigne} />
      </div>

      <div ref={ref} className="relative mt-3 min-h-[340px] flex-1 select-none">
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] border-4 border-white shadow-[0_6px_0_rgba(45,42,38,0.1)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- décor local */}
          <img src={scene} alt="" className="h-full w-full object-cover" draggable={false} />
        </div>

        <p
          className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-3 py-1 font-display text-lg shadow"
          aria-label={`${partie.restants.length} à placer`}
        >
          {partie.ranges.length} / {objets.length}
        </p>

        {bacs.map((id, i) => {
          const z = zone(...rects[i]);
          const bac = BACS[id];
          const places = objets.filter((o) => partie.ranges.includes(o.id) && o.bac === id);
          // Ce qui est bien placé se range en grille dans sa zone.
          const t = Math.round(Math.min(z.width / 3, (z.height - 40) / 2.4, 92));
          const colonnes = Math.max(1, Math.floor(z.width / (t * 1.02)));
          return (
            <button
              key={id}
              ref={(el) => {
                zones.current[id] = el;
              }}
              type="button"
              onClick={() => objetChoisi && repondre(objetChoisi, id)}
              className={`absolute z-10 rounded-[1.5rem] transition-colors ${
                survol === id ? "bg-white/30 ring-4 ring-inset ring-white" : ""
              } ${aide === id ? "anim-glow bg-ng-sun-soft/40" : ""}`}
              style={z}
              aria-label={`Mettre « ${objetChoisi?.nom ?? ""} » : ${bac.nom}`}
            >
              <span className={`absolute ${i % 2 ? "right-2" : "left-2"} ${i < 2 ? "top-12" : "top-2"}`}>
                <Etiquette texte={bac.nom} couleur={bac.couleurFoncee} className="text-xs sm:text-sm" />
              </span>
              {places.map((o, k) => {
                const col = k % colonnes;
                const ligne = Math.floor(k / colonnes);
                const marge = (z.width - colonnes * t) / 2;
                return (
                  // eslint-disable-next-line @next/next/no-img-element -- élément dessiné local
                  <img
                    key={o.id}
                    src={o.image}
                    alt=""
                    draggable={false}
                    className="anim-pop pointer-events-none absolute object-contain"
                    style={{
                      width: t,
                      height: t,
                      left: marge + col * t,
                      bottom: 8 + ligne * t * 0.85,
                      filter: "drop-shadow(0 4px 3px rgba(0,0,0,0.3))",
                    }}
                  />
                );
              })}
            </button>
          );
        })}

        <BulleRetour retour={partie.retour} />
      </div>

      {/* Le panier : ce qu'il reste à placer */}
      <div className="mt-3 flex min-h-[5.5rem] flex-wrap items-center justify-center gap-1 rounded-3xl bg-white/70 p-2 shadow-inner">
        {partie.restants.map((o) => {
          const actif = objetChoisi?.id === o.id;
          const secoue = secousse?.id === o.id;
          return (
            <button
              key={secoue ? `${o.id}-${secousse.cle}` : o.id}
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
              aria-label={`${o.nom}. Glisse-le dans la bonne zone, ou touche-le puis touche une zone.`}
              className={`relative cursor-grab touch-none rounded-2xl active:cursor-grabbing ${secoue ? "anim-shake" : ""} ${
                actif ? "bg-ng-sun-soft" : ""
              }`}
              style={{ width: taillePanier, height: taillePanier, zIndex: tenu === o.id ? 60 : 1 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- élément dessiné local */}
              <img
                src={o.image}
                alt=""
                draggable={false}
                className="pointer-events-none h-full w-full object-contain"
                style={{
                  filter: actif
                    ? "drop-shadow(0 0 3px #fff) drop-shadow(0 0 8px rgba(255,196,40,0.95))"
                    : "drop-shadow(0 3px 2px rgba(0,0,0,0.25))",
                }}
              />
            </button>
          );
        })}
        {objetChoisi ? (
          <p className="w-full truncate text-center font-display text-base">
            {partie.premierGeste ? "👆 " : ""}
            {objetChoisi.nom}
          </p>
        ) : null}
      </div>
    </div>
  );
}
