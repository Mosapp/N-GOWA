"use client";

import { useState } from "react";

import { PinBadge } from "@/components/art/PinBadge";
import { Btn, Confetti, Mascot, ProgressBar, Sheet, SpeechBubble } from "@/components/ui";
import { PIN_BY_ID, PINS } from "@/content/pins";
import type { PinContent } from "@/content/types";
import { progressionPin } from "@/lib/game/rules";
import type { Sauvegarde } from "@/lib/game/save";
import { modifierSauvegarde } from "@/lib/game/store";
import { marquerPinsVus } from "@/lib/game/rules";

function dateCourte(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

/** Collection personnelle de pins (visible uniquement sur cet appareil). */
export function PinsScreen({ save }: { save: Sauvegarde }) {
  const [detail, setDetail] = useState<PinContent | null>(null);
  const obtenus = PINS.filter((p) => save.pins[p.id]).length;
  const message = obtenus
    ? `Tu as ${obtenus} pin${obtenus > 1 ? "s" : ""} dans ta collection. Bravo !`
    : "Ta collection est encore vide. Joue au Village du Tri pour gagner ton premier pin !";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-2 lg:max-w-5xl lg:px-8 lg:pt-8">
      <h1 className="font-display text-3xl">Mes pins</h1>
      <div className="mt-2 flex items-center gap-2">
        <Mascot id="awa" size={80} />
        <div className="flex-1">
          <SpeechBubble qui="Awa" color="#7A4BC0" size="sm" texteVoix={message}>
            <p>{message}</p>
          </SpeechBubble>
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {PINS.map((pin) => {
          const obtenu = save.pins[pin.id];
          const prog = progressionPin(save, pin);
          return (
            <li key={pin.id}>
              <button
                type="button"
                onClick={() => setDetail(pin)}
                className="card-ng flex h-full w-full flex-col items-center p-3 text-center"
                aria-label={`${pin.nom}${obtenu ? ", obtenu" : ", pas encore obtenu"}`}
              >
                <PinBadge pin={pin} obtenu={Boolean(obtenu)} size={96} />
                <span className="mt-1 font-display text-lg leading-tight">{pin.nom}</span>
                {obtenu ? (
                  <span className="text-sm font-bold text-ng-green-dark">Obtenu le {dateCourte(obtenu.obtenuLe)}</span>
                ) : (
                  <span className="mt-1 w-full">
                    <ProgressBar value={prog.actuel} max={prog.cible} color="bg-ng-yellow" height="h-2.5" label={`progression vers ${pin.nom}`} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-center text-sm font-bold text-ng-muted">
        Tes pins restent sur cet appareil. Personne d&apos;autre ne voit ta collection.
      </p>

      {detail ? (
        <Sheet label={detail.nom} onClose={() => setDetail(null)}>
          <div className="flex flex-col items-center text-center">
            <PinBadge pin={detail} obtenu={Boolean(save.pins[detail.id])} size={140} />
            <h2 className="mt-2 font-display text-3xl">{detail.nom}</h2>
            <p className="mt-1 text-lg font-bold">{detail.description}</p>
            {!save.pins[detail.id] ? (
              <p className="mt-3 rounded-2xl bg-ng-sun-soft p-3 font-display text-lg">{detail.commentObtenir}</p>
            ) : null}
            <div className="mt-5 w-full">
              <Btn onClick={() => setDetail(null)}>Fermer</Btn>
            </div>
          </div>
        </Sheet>
      ) : null}
    </main>
  );
}

/** Célébration d'un pin obtenu hors mission (ex. défi validé par un adulte). */
export function PinCelebration({ pinIds }: { pinIds: string[] }) {
  const pin = PIN_BY_ID[pinIds[0]];
  if (!pin) return null;
  const fermer = () => modifierSauvegarde(marquerPinsVus);
  return (
    <>
      <Confetti />
      <Sheet label="Nouveau pin" onClose={fermer}>
        <div className="flex flex-col items-center text-center">
          <p className="font-display text-xl text-ng-yellow-dark">Nouveau pin !</p>
          <div className="anim-pop">
            <PinBadge pin={pin} obtenu size={150} />
          </div>
          <h2 className="font-display text-3xl">{pin.nom}</h2>
          <p className="mt-1 text-lg font-bold">{pin.description}</p>
          <div className="mt-5 w-full">
            <Btn size="lg" onClick={fermer} sound="win">
              Super !
            </Btn>
          </div>
        </div>
      </Sheet>
    </>
  );
}
