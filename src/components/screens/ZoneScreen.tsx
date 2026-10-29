"use client";

import { useState } from "react";

import { VillageScene } from "@/components/art/Scenes";
import { IconCheck, IconLock, IconPlay } from "@/components/icons";
import type { Naviguer } from "@/components/navigation";
import { Btn, CharacterMedallion, ScreenHeader, Sheet, SpeechBubble, Stars } from "@/components/ui";
import { SECONDARY_CHARACTERS } from "@/content/characters";
import type { MissionContent, ZoneId } from "@/content/types";
import { ZONE_BY_ID } from "@/content/zones";
import { complexitePour, missionsDeZone, pointsZone, statutMission } from "@/lib/game/rules";
import type { Sauvegarde } from "@/lib/game/save";
import type { StatutTemps } from "@/lib/game/screenTime";
import { playTone, warmUpAudio } from "@/lib/audio";

/** Une zone : son décor, ses personnages et ses missions le long d'un chemin. */
export function ZoneScreen({
  save,
  zoneId,
  naviguer,
  statut,
}: {
  save: Sauvegarde;
  zoneId: ZoneId;
  naviguer: Naviguer;
  statut: StatutTemps | null;
}) {
  const zone = ZONE_BY_ID[zoneId];
  const missions = missionsDeZone(zoneId);
  const [ouverte, setOuverte] = useState<MissionContent | null>(null);
  const complexite = complexitePour(save.profil!.tranche);
  const peutJouer = statut?.etat === "libre" || statut?.etat === "bientot";

  return (
    <main className="mx-auto w-full max-w-xl">
      <ScreenHeader title={zone.nom} onBack={() => naviguer({ nom: "carte" })} sticky={false} />
      <div className="overflow-hidden rounded-b-[2rem] shadow-[0_6px_0_rgba(45,42,38,0.06)]">
        <VillageScene />
      </div>
      <p className="px-5 pt-3 text-center font-bold text-ng-muted">
        {zone.accroche} · {pointsZone(save, zoneId)} points ici
      </p>

      <ol className="relative mx-auto mt-4 flex max-w-sm flex-col gap-3 px-5" aria-label="Missions">
        {missions.map((mission, i) => {
          const statutM = statutMission(save, mission);
          const record = save.missions[mission.id];
          const perso = SECONDARY_CHARACTERS[mission.personnageId];
          const decalage = i % 2 === 0 ? "self-start" : "self-end";
          const prochaine = statutM === "disponible";
          return (
            <li key={mission.id} className={`relative w-[82%] ${decalage}`}>
              {i > 0 ? (
                <span
                  className="absolute -top-4 left-1/2 h-5 w-1.5 -translate-x-1/2 rounded-full bg-ng-earth/30"
                  aria-hidden
                />
              ) : null}
              <button
                type="button"
                onClick={() => {
                  playTone(statutM === "verrouillee" ? "tap" : "pop");
                  warmUpAudio();
                  setOuverte(mission);
                }}
                className={`flex w-full items-center gap-3 rounded-[1.75rem] border-4 p-3 text-left shadow-[0_6px_0_rgba(45,42,38,0.08)] ${
                  prochaine
                    ? "anim-glow border-ng-yellow bg-white"
                    : statutM === "terminee"
                      ? "border-ng-leaf bg-ng-leaf-soft"
                      : "border-transparent bg-white/70"
                }`}
                aria-label={`Mission ${mission.ordre} : ${mission.titre}${
                  statutM === "verrouillee" ? ", verrouillée" : statutM === "terminee" ? ", terminée" : ", à jouer"
                }`}
              >
                <div className={statutM === "verrouillee" ? "opacity-50 grayscale" : ""}>
                  <CharacterMedallion id={mission.personnageId} size={60} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm text-ng-muted">
                    Mission {mission.ordre} · {perso?.nom}
                  </p>
                  <p className="font-display text-lg leading-tight">{mission.titre}</p>
                  {record ? (
                    <div className="mt-1 flex">
                      <Stars count={record.meilleuresEtoiles} size={20} />
                    </div>
                  ) : null}
                </div>
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                    statutM === "terminee"
                      ? "bg-ng-green text-white"
                      : statutM === "disponible"
                        ? "bg-ng-yellow text-ng-ink"
                        : "bg-ng-ink/10 text-ng-muted"
                  }`}
                  aria-hidden
                >
                  {statutM === "terminee" ? <IconCheck size={24} /> : statutM === "disponible" ? <IconPlay size={22} /> : <IconLock size={22} />}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 px-6 text-center text-sm font-bold text-ng-muted">
        Les prochaines zones arrivent bientôt sur la carte.
      </p>

      {ouverte ? (
        <MissionSheet
          mission={ouverte}
          save={save}
          complexite={complexite}
          peutJouer={peutJouer}
          onClose={() => setOuverte(null)}
          onPlay={() => {
            setOuverte(null);
            naviguer({ nom: "mission", missionId: ouverte.id, graine: Math.floor(Math.random() * 2 ** 31) });
          }}
        />
      ) : null}
    </main>
  );
}

function MissionSheet({
  mission,
  save,
  complexite,
  peutJouer,
  onClose,
  onPlay,
}: {
  mission: MissionContent;
  save: Sauvegarde;
  complexite: "petit" | "grand";
  peutJouer: boolean;
  onClose: () => void;
  onPlay: () => void;
}) {
  const statutM = statutMission(save, mission);
  const perso = SECONDARY_CHARACTERS[mission.personnageId];
  const record = save.missions[mission.id];

  return (
    <Sheet label={mission.titre} onClose={onClose}>
      <div className="flex items-center gap-3">
        <CharacterMedallion id={mission.personnageId} size={72} />
        <div>
          <p className="font-display text-sm text-ng-muted">
            {perso?.nom} · {perso?.role}
          </p>
          <h2 className="font-display text-2xl leading-tight">{mission.titre}</h2>
        </div>
      </div>

      {statutM === "verrouillee" ? (
        <div className="mt-4">
          <SpeechBubble qui="Kofi" texteVoix="Termine d'abord la mission d'avant, et celle-ci s'ouvrira !">
            <p>Termine d&apos;abord la mission d&apos;avant, et celle-ci s&apos;ouvrira !</p>
          </SpeechBubble>
          <div className="mt-5">
            <Btn variant="white" onClick={onClose}>
              D&apos;accord
            </Btn>
          </div>
        </div>
      ) : (
        <>
          <ul className="mt-4 grid gap-2">
            <Objectif emoji="💡" titre="J'apprends" texte={mission.objectif.japprends} />
            <Objectif emoji="✋" titre="Je pratique" texte={mission.objectif.jepratique} />
            {complexite === "grand" ? (
              <Objectif emoji="🌍" titre="À quoi ça sert ?" texte={mission.objectif.pourquoi} />
            ) : null}
          </ul>
          {record ? (
            <p className="mt-3 text-center font-bold text-ng-muted">
              Ton meilleur score : {record.meilleursPoints} points. Rejoue pour t&apos;entraîner !
            </p>
          ) : null}
          <div className="mt-5 grid gap-2">
            {peutJouer ? (
              <Btn size="lg" sound="pop" onClick={onPlay}>
                {record ? "Rejouer" : "Jouer !"}
              </Btn>
            ) : (
              <p className="rounded-2xl bg-ng-sun-soft p-3 text-center font-display">
                C&apos;est l&apos;heure de la pause. On jouera après !
              </p>
            )}
            <Btn variant="white" onClick={onClose}>
              Plus tard
            </Btn>
          </div>
        </>
      )}
    </Sheet>
  );
}

function Objectif({ emoji, titre, texte }: { emoji: string; titre: string; texte: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-white p-3">
      <span className="text-2xl" aria-hidden>
        {emoji}
      </span>
      <span>
        <span className="block font-display text-base text-ng-muted">{titre}</span>
        <span className="block font-bold leading-snug">{texte}</span>
      </span>
    </li>
  );
}
