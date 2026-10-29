"use client";

import { useEffect } from "react";

import { WelcomeScene } from "@/components/art/Scenes";
import { Btn, Mascot, ProgressBar, SpeechBubble, useDireAuMontage } from "@/components/ui";
import { PAUSE_ACTIVITIES } from "@/content/curriculum";
import { commencerPause, normaliserTemps, type Limites } from "@/lib/game/screenTime";
import type { TempsEcran } from "@/lib/game/save";
import { modifierSauvegarde } from "@/lib/game/store";

/**
 * La pause de Kofi : proposée (pas imposée brutalement) à la fin d'une
 * session, avec une activité hors écran. Le compte à rebours survit au
 * rechargement de la page.
 */
export function PauseScreen({
  temps,
  limites,
  now,
  onParent,
}: {
  temps: TempsEcran;
  limites: Limites;
  now: number;
  onParent: () => void;
}) {
  useEffect(() => {
    if (temps.pauseDebut === null) {
      modifierSauvegarde((s) => ({ ...s, temps: commencerPause(s.temps, Date.now()) }));
    }
  }, [temps.pauseDebut]);

  const debut = temps.pauseDebut ?? now;
  const totalMs = limites.pauseSec * 1000;
  const ecoule = Math.max(0, now - debut);
  const resteMs = Math.max(0, totalMs - ecoule);
  const finie = temps.pauseDebut !== null && resteMs === 0;
  const activite = PAUSE_ACTIVITIES[Math.floor(debut / 60000) % PAUSE_ACTIVITIES.length];
  const minutes = Math.floor(resteMs / 60000);
  const secondes = Math.floor((resteMs % 60000) / 1000);
  const message = finie
    ? "La pause est finie ! On repart à l'aventure ?"
    : "Je me repose un peu sous le baobab. Toi aussi, fais une pause !";
  useDireAuMontage(message);

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <WelcomeScene />
      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-8 pt-8">
        <h1 className="rounded-3xl bg-white/85 py-2 text-center font-display text-3xl">La pause de Kofi</h1>
        <div className="mt-4">
          <SpeechBubble qui="Kofi" texteVoix={message} size="lg">
            <p>{message}</p>
          </SpeechBubble>
        </div>
        <div className="flex flex-1 items-end justify-center pt-4">
          <Mascot id="kofi" size={190} />
        </div>
        <div className="card-ng mt-4 p-4 text-center">
          {finie ? (
            <Btn
              size="lg"
              onClick={() =>
                modifierSauvegarde((s) => ({ ...s, temps: normaliserTemps(s.temps, Date.now(), limites) }))
              }
            >
              Reprendre l&apos;aventure
            </Btn>
          ) : (
            <>
              <p className="font-display text-base text-ng-muted">Pendant la pause :</p>
              <p className="font-display text-2xl leading-tight">{activite}</p>
              <div className="mt-3">
                <ProgressBar value={ecoule} max={totalMs} color="bg-ng-blue" label="temps de pause" />
              </div>
              <p className="mt-2 font-display text-3xl text-ng-blue" aria-live="off">
                {minutes}:{String(secondes).padStart(2, "0")}
              </p>
            </>
          )}
        </div>
        <button type="button" onClick={onParent} className="mt-3 min-h-[44px] font-bold text-ng-muted underline">
          Espace parent
        </button>
      </div>
    </main>
  );
}

/** Fin de journée : on félicite, on ne culpabilise pas. */
export function DayEndScreen({ pseudo, onParent }: { pseudo: string; onParent: () => void }) {
  const message = `Bravo ${pseudo} ! Tu as bien joué aujourd'hui. Maintenant, va jouer dehors et essaie un geste pour la nature. À demain !`;
  useDireAuMontage(message);
  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <WelcomeScene />
      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-8 pt-8">
        <h1 className="rounded-3xl bg-white/85 py-2 text-center font-display text-3xl">À demain !</h1>
        <div className="mt-4">
          <SpeechBubble qui="Awa" color="#7A4BC0" texteVoix={message} size="lg">
            <p>{message}</p>
          </SpeechBubble>
        </div>
        <div className="flex flex-1 items-end justify-center gap-1 pt-4">
          <Mascot id="awa" size={180} />
          <Mascot id="kofi" size={190} />
        </div>
        <button type="button" onClick={onParent} className="mt-4 min-h-[44px] font-bold text-ng-muted underline">
          Espace parent
        </button>
      </div>
    </main>
  );
}
