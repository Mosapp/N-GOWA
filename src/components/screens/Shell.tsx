"use client";

import { useState, type ReactNode } from "react";

import { IconGear, IconLock, IconMap, IconMedal, IconSound, IconSprout, IconStar } from "@/components/icons";
import type { Naviguer, Route } from "@/components/navigation";
import { Avatar, Btn, Sheet } from "@/components/ui";
import { pointsTotal } from "@/lib/game/rules";
import type { Reglages, Sauvegarde } from "@/lib/game/save";
import type { StatutTemps } from "@/lib/game/screenTime";
import { modifierSauvegarde } from "@/lib/game/store";
import { playTone } from "@/lib/audio";

/** Cadre commun des écrans enfant : en-tête simple + navigation à trois boutons. */
export function Shell({
  save,
  route,
  naviguer,
  statut,
  children,
}: {
  save: Sauvegarde;
  route: Route;
  naviguer: Naviguer;
  statut: StatutTemps | null;
  children: ReactNode;
}) {
  const [reglages, setReglages] = useState(false);
  const profil = save.profil!;
  const nbPins = Object.keys(save.pins).length;
  const defisEnCours = Object.values(save.defis).filter((d) => d.statut === "accepte").length;

  return (
    <div className="min-h-[100dvh] pb-28">
      <header className="sticky top-0 z-30 bg-ng-cream/95 px-3 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <button
            type="button"
            onClick={() => naviguer({ nom: "fiche" })}
            className="flex min-h-[56px] min-w-0 items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 shadow-[0_3px_0_rgba(45,42,38,0.08)]"
            aria-label={`Ma fiche de progression, ${profil.pseudo}`}
          >
            <Avatar id={profil.avatar} size={46} />
            <span className="truncate font-display text-lg">{profil.pseudo}</span>
          </button>
          <div
            className="flex min-h-[48px] items-center gap-1 rounded-full bg-ng-sun-soft px-3 font-display text-lg"
            aria-label={`${pointsTotal(save)} points`}
          >
            <IconStar size={24} />
            {pointsTotal(save)}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                playTone("tap");
                setReglages(true);
              }}
              className="tap-target flex flex-col items-center justify-center rounded-2xl text-ng-muted"
              aria-label="Réglages du son"
            >
              <IconSound size={26} muted={!save.reglages.sons && !save.reglages.voix} />
              <span className="text-[11px] font-extrabold">Son</span>
            </button>
            <button
              type="button"
              onClick={() => naviguer({ nom: "parent" })}
              className="tap-target flex flex-col items-center justify-center rounded-2xl text-ng-muted"
              aria-label="Espace parent"
            >
              <IconLock size={24} />
              <span className="text-[11px] font-extrabold">Parents</span>
            </button>
          </div>
        </div>
        {statut?.etat === "bientot" ? (
          <div className="anim-rise mx-auto mt-2 flex max-w-xl items-center gap-2 rounded-2xl bg-ng-sun-soft px-3 py-2 font-display text-base" role="status">
            <span aria-hidden>🌅</span>
            Bientôt la pause ! Tu peux finir ta mission tranquillement.
          </div>
        ) : null}
      </header>

      {children}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ng-ink/5 bg-white/95 px-2 pt-2 backdrop-blur safe-bottom" aria-label="Navigation">
        <ul className="mx-auto flex max-w-xl gap-1">
          <NavItem
            label="Carte"
            actif={route.nom === "carte" || route.nom === "zone"}
            onClick={() => naviguer({ nom: "carte" })}
            icone={<IconMap size={30} />}
          />
          <NavItem
            label="Mes pins"
            actif={route.nom === "pins"}
            onClick={() => naviguer({ nom: "pins" })}
            icone={<IconMedal size={30} />}
            pastille={nbPins ? String(nbPins) : undefined}
          />
          <NavItem
            label="Défis"
            actif={route.nom === "defis"}
            onClick={() => naviguer({ nom: "defis" })}
            icone={<IconSprout size={30} />}
            pastille={defisEnCours ? String(defisEnCours) : undefined}
          />
        </ul>
      </nav>

      {reglages ? <ReglagesSheet reglages={save.reglages} onClose={() => setReglages(false)} /> : null}
    </div>
  );
}

function NavItem({
  label,
  actif,
  onClick,
  icone,
  pastille,
}: {
  label: string;
  actif: boolean;
  onClick: () => void;
  icone: ReactNode;
  pastille?: string;
}) {
  return (
    <li className="flex-1">
      <button
        type="button"
        onClick={() => {
          playTone("tap");
          onClick();
        }}
        aria-current={actif ? "page" : undefined}
        className={`relative flex min-h-[60px] w-full flex-col items-center justify-center gap-0.5 rounded-2xl ${
          actif ? "bg-ng-leaf-soft text-ng-green-dark" : "text-ng-muted"
        }`}
      >
        {icone}
        <span className="font-display text-sm leading-none">{label}</span>
        {pastille ? (
          <span className="absolute right-[22%] top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-ng-coral px-1.5 font-display text-xs text-white">
            {pastille}
          </span>
        ) : null}
      </button>
    </li>
  );
}

export function ReglagesSheet({ reglages, onClose }: { reglages: Reglages; onClose: () => void }) {
  const basculer = (cle: keyof Reglages) =>
    modifierSauvegarde((s) => ({ ...s, reglages: { ...s.reglages, [cle]: !s.reglages[cle] } }));
  return (
    <Sheet label="Réglages" onClose={onClose}>
      <div className="flex items-center gap-2">
        <IconGear size={28} />
        <h2 className="font-display text-2xl">Réglages</h2>
      </div>
      <div className="mt-4 grid gap-3">
        <Toggle label="Les sons" emoji="🔔" actif={reglages.sons} onClick={() => basculer("sons")} />
        <Toggle label="La voix de Kofi et Awa" emoji="🗣️" actif={reglages.voix} onClick={() => basculer("voix")} />
        <Toggle
          label="Moins d'animations"
          emoji="🐢"
          actif={reglages.animationsReduites}
          onClick={() => basculer("animationsReduites")}
        />
      </div>
      <div className="mt-5">
        <Btn onClick={onClose}>Fermer</Btn>
      </div>
    </Sheet>
  );
}

export function Toggle({
  label,
  emoji,
  actif,
  onClick,
}: {
  label: string;
  emoji: string;
  actif: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      onClick={onClick}
      className="flex min-h-[64px] items-center gap-3 rounded-3xl bg-white px-4 text-left shadow-[0_3px_0_rgba(45,42,38,0.06)]"
    >
      <span className="text-3xl" aria-hidden>
        {emoji}
      </span>
      <span className="flex-1 font-display text-lg">{label}</span>
      <span
        className={`relative h-9 w-16 rounded-full transition-colors ${actif ? "bg-ng-green" : "bg-ng-ink/20"}`}
        aria-hidden
      >
        <span
          className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${actif ? "left-8" : "left-1"}`}
        />
      </span>
      <span className="sr-only">{actif ? "activé" : "désactivé"}</span>
    </button>
  );
}
