"use client";

import { useState, type ReactNode } from "react";

import { IconGear, IconLock, IconMap, IconMedal, IconSheet, IconSound, IconSprout, IconStar } from "@/components/icons";
import type { Naviguer, Route } from "@/components/navigation";
import { Avatar, Btn, Sheet } from "@/components/ui";
import { Logo } from "@/components/screens/Welcome";
import { pointsTotal } from "@/lib/game/rules";
import type { Reglages, Sauvegarde } from "@/lib/game/save";
import type { StatutTemps } from "@/lib/game/screenTime";
import { modifierSauvegarde } from "@/lib/game/store";
import { playTone } from "@/lib/audio";

/**
 * Cadre commun des écrans enfant.
 * Téléphone : en-tête compact + barre du bas. Tablette paysage et ordinateur : menu latéral.
 */
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

  const points = pointsTotal(save);
  const liens = [
    { label: "Carte", actif: route.nom === "carte" || route.nom === "zone", route: { nom: "carte" } as Route, icone: <IconMap size={28} /> },
    { label: "Mes pins", actif: route.nom === "pins", route: { nom: "pins" } as Route, icone: <IconMedal size={28} />, pastille: nbPins },
    { label: "Défis", actif: route.nom === "defis", route: { nom: "defis" } as Route, icone: <IconSprout size={28} />, pastille: defisEnCours },
  ];
  const ouvrirReglages = () => {
    playTone("tap");
    setReglages(true);
  };

  return (
    <div className="min-h-[100dvh] pb-28 lg:pb-10 lg:pl-72">
      {/* -------- Tablette paysage et ordinateur : menu latéral -------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-ng-ink/5 bg-white/85 px-4 py-6 backdrop-blur lg:flex">
        <div className="px-2">
          <Logo size="sm" />
          <p className="mt-1 text-center text-xs font-bold text-ng-muted">Apprendre · Jouer · Comprendre · Agir</p>
        </div>
        <nav className="mt-8" aria-label="Navigation principale">
          <ul className="grid gap-1">
            {liens.map((l) => (
              <li key={l.label}>
                <button
                  type="button"
                  onClick={() => {
                    playTone("tap");
                    naviguer(l.route);
                  }}
                  aria-current={l.actif ? "page" : undefined}
                  className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl px-4 font-display text-lg transition-colors ${
                    l.actif ? "bg-ng-leaf-soft text-ng-green-dark" : "text-ng-muted hover:bg-ng-cream"
                  }`}
                >
                  {l.icone}
                  <span className="flex-1 text-left">{l.label}</span>
                  {l.pastille ? (
                    <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-ng-coral px-2 text-sm text-white">
                      {l.pastille}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => naviguer({ nom: "fiche" })}
                className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl px-4 font-display text-lg text-ng-muted hover:bg-ng-cream"
              >
                <IconSheet size={28} />
                <span className="flex-1 text-left">Ma fiche</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="mt-auto grid gap-3">
          <div className="hero-ng rounded-3xl p-4">
            <div className="flex items-center gap-3">
              <Avatar id={profil.avatar} size={52} />
              <div className="min-w-0">
                <p className="truncate font-display text-lg leading-tight">{profil.pseudo}</p>
                <p className="flex items-center gap-1 font-display text-base text-ng-muted">
                  <IconStar size={18} /> {points} points
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={ouvrirReglages}
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-white font-display text-ng-muted shadow-sm"
            >
              <IconSound size={22} muted={!save.reglages.sons && !save.reglages.voix} /> Son
            </button>
            <button
              type="button"
              onClick={() => naviguer({ nom: "parent" })}
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-white font-display text-ng-muted shadow-sm"
            >
              <IconLock size={20} /> Parents
            </button>
          </div>
        </div>
      </aside>

      {/* -------- Téléphone et tablette portrait : en-tête compact -------- */}
      <header className="sticky top-0 z-30 bg-ng-cream/90 px-3 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <button
            type="button"
            onClick={() => naviguer({ nom: "fiche" })}
            className="flex min-h-[56px] min-w-0 items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 shadow-sm"
            aria-label={`Ma fiche de progression, ${profil.pseudo}`}
          >
            <Avatar id={profil.avatar} size={46} />
            <span className="truncate font-display text-lg">{profil.pseudo}</span>
          </button>
          <div
            className="flex min-h-[48px] items-center gap-1 rounded-full bg-ng-sun-soft px-3 font-display text-lg"
            aria-label={`${points} points`}
          >
            <IconStar size={24} />
            {points}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={ouvrirReglages}
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
      </header>

      {statut?.etat === "bientot" ? (
        <div className="anim-rise mx-auto mt-2 flex max-w-3xl items-center gap-2 rounded-2xl bg-ng-sun-soft px-3 py-2 font-display text-base lg:mx-8 lg:mt-6 lg:max-w-none" role="status">
          <span aria-hidden>🌅</span>
          Bientôt la pause ! Tu peux finir ta mission tranquillement.
        </div>
      ) : null}

      {children}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ng-ink/5 bg-white/95 px-2 pt-2 backdrop-blur safe-bottom lg:hidden" aria-label="Navigation">
        <ul className="mx-auto flex max-w-3xl gap-1">
          {liens.map((l) => (
            <NavItem
              key={l.label}
              label={l.label}
              actif={l.actif}
              onClick={() => naviguer(l.route)}
              icone={l.icone}
              pastille={l.pastille ? String(l.pastille) : undefined}
            />
          ))}
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
        <Toggle label="Les bruits de la nature" emoji="🐦" actif={reglages.ambiance} onClick={() => basculer("ambiance")} />
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
