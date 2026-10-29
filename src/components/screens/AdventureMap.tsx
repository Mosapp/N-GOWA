"use client";

import { useState } from "react";

import { MAP_POSITIONS, MAP_VIEWBOX, MapScene } from "@/components/art/Scenes";
import { IconLock, IconStar } from "@/components/icons";
import type { Naviguer } from "@/components/navigation";
import { Avatar, Btn, Mascot, Sheet, SpeechBubble } from "@/components/ui";
import { THEME_BY_ID } from "@/content/curriculum";
import type { ZoneContent } from "@/content/types";
import { ZONES } from "@/content/zones";
import { progressionZone, statutZone } from "@/lib/game/rules";
import type { Sauvegarde } from "@/lib/game/save";
import { playTone } from "@/lib/audio";

/** Carte d'aventure : les quatre zones reliées par un chemin. */
export function AdventureMap({ save, naviguer }: { save: Sauvegarde; naviguer: Naviguer }) {
  const [bientot, setBientot] = useState<ZoneContent | null>(null);
  const profil = save.profil!;
  const village = progressionZone(save, "village-tri");
  const message =
    village.terminees === 0
      ? `${profil.pseudo}, touche le Village du Tri pour commencer !`
      : village.terminees < village.total
        ? "Le Village du Tri a encore des missions pour toi !"
        : "Bravo, tu as terminé toutes les missions du Village !";

  return (
    <main className="mx-auto w-full max-w-xl">
      <div className="flex items-center gap-2 px-4 pt-2">
        <Mascot id="kofi" size={88} />
        <div className="flex-1">
          <SpeechBubble qui="Kofi" size="sm" texteVoix={message}>
            <p>{message}</p>
          </SpeechBubble>
        </div>
      </div>

      <div className="relative mt-3 overflow-hidden rounded-t-[2.5rem]">
        <MapScene />
        {ZONES.map((zone) => {
          const pos = MAP_POSITIONS[zone.id];
          const ouverte = statutZone(zone.id) === "ouverte";
          const prog = progressionZone(save, zone.id);
          const theme = THEME_BY_ID[zone.pilier];
          return (
            <div
              key={zone.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${(pos.x / MAP_VIEWBOX.w) * 100}%`, top: `${(pos.y / MAP_VIEWBOX.h) * 100}%` }}
            >
              {ouverte ? (
                <div className="anim-float absolute -top-14" aria-hidden>
                  <Avatar id={profil.avatar} size={48} />
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  playTone("pop");
                  if (ouverte) naviguer({ nom: "zone", zoneId: zone.id });
                  else setBientot(zone);
                }}
                className={`flex flex-col items-center ${ouverte ? "" : "opacity-90"}`}
                aria-label={
                  ouverte
                    ? `${zone.nom} : ${prog.terminees} missions sur ${prog.total} terminées`
                    : `${zone.nom} : bientôt disponible`
                }
              >
                <span
                  className={`flex h-[76px] w-[76px] items-center justify-center rounded-full border-[5px] border-white text-4xl shadow-[0_6px_0_rgba(45,42,38,0.18)] ${
                    ouverte ? "anim-glow" : "grayscale-[0.6]"
                  }`}
                  style={{ background: ouverte ? zone.couleur : "#CFC6B9" }}
                >
                  {ouverte ? theme.icone : <IconLock size={34} className="text-white" />}
                </span>
                <span className="mt-1 max-w-[150px] rounded-2xl bg-white/95 px-3 py-1 text-center shadow-[0_3px_0_rgba(45,42,38,0.1)]">
                  <span className="block font-display text-base leading-tight">{zone.nom}</span>
                  {ouverte ? (
                    <span className="flex items-center justify-center gap-1 font-display text-sm text-ng-muted">
                      <IconStar size={16} /> {prog.etoiles}/{prog.etoilesMax} · {prog.terminees}/{prog.total}
                    </span>
                  ) : (
                    <span className="block font-display text-sm text-ng-muted">Bientôt</span>
                  )}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {bientot ? (
        <Sheet label={bientot.nom} onClose={() => setBientot(null)}>
          <div className="flex items-center gap-3">
            <Mascot id="awa" size={110} />
            <div>
              <h2 className="font-display text-2xl leading-tight">{bientot.nom}</h2>
              <p className="mt-1 font-bold text-ng-muted">{bientot.accroche}</p>
            </div>
          </div>
          <div className="mt-4">
            <SpeechBubble qui="Awa" color="#7A4BC0" texteVoix="Cette zone n'est pas encore prête. On la prépare pour toi ! En attendant, le Village du Tri t'attend.">
              <p>Cette zone n&apos;est pas encore prête. On la prépare pour toi ! En attendant, le Village du Tri t&apos;attend.</p>
            </SpeechBubble>
          </div>
          <div className="mt-5 grid gap-2">
            <Btn
              onClick={() => {
                setBientot(null);
                naviguer({ nom: "zone", zoneId: "village-tri" });
              }}
            >
              Aller au Village du Tri
            </Btn>
            <Btn variant="white" onClick={() => setBientot(null)}>
              Fermer
            </Btn>
          </div>
        </Sheet>
      ) : null}
    </main>
  );
}
