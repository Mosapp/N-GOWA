"use client";

import { useState } from "react";

import { PinBadge } from "@/components/art/PinBadge";
import { MAP_POSITIONS, MAP_VIEWBOX, MapScene } from "@/components/art/Scenes";
import { IconCheck, IconLock, IconPlay, IconStar } from "@/components/icons";
import type { Naviguer } from "@/components/navigation";
import { Avatar, Btn, CharacterMedallion, DecorFond, DECORS, Illustration, Mascot, ProgressBar, Sheet, SpeechBubble } from "@/components/ui";
import { THEME_BY_ID } from "@/content/curriculum";
import { SECONDARY_CHARACTERS } from "@/content/characters";
import type { ZoneContent } from "@/content/types";
import { ZONE_BY_ID, ZONES } from "@/content/zones";
import {
  progressionPin,
  progressionZone,
  prochaineMission,
  prochainPin,
  semaine,
  statutZone,
} from "@/lib/game/rules";
import type { Sauvegarde } from "@/lib/game/save";
import { limiteJour, limitesPour, normaliserTemps } from "@/lib/game/screenTime";
import { playTone, warmUpAudio } from "@/lib/audio";

const NOMS_COURTS: Record<string, string> = {
  dechets: "Déchets",
  eau: "Eau",
  biodiversite: "Nature",
  energie: "Énergie",
};

/**
 * Accueil de l'aventure : bannière, mission à continuer, piliers, carte,
 * temps de jeu et prochain pin. Une colonne sur téléphone, deux sur grand écran.
 */
export function AdventureMap({ save, naviguer, now }: { save: Sauvegarde; naviguer: Naviguer; now: number }) {
  const [bientot, setBientot] = useState<ZoneContent | null>(null);
  const profil = save.profil!;
  const prochaine = prochaineMission(save);

  const jouer = () => {
    warmUpAudio();
    if (prochaine) naviguer({ nom: "mission", missionId: prochaine.id, graine: Math.floor(Math.random() * 2 ** 31) });
    else naviguer({ nom: "zone", zoneId: "village-tri" });
  };
  const ouvrirZone = (zone: ZoneContent) => {
    playTone("pop");
    if (statutZone(zone.id) === "ouverte") naviguer({ nom: "zone", zoneId: zone.id });
    else setBientot(zone);
  };

  const encarts = (
    <>
      <TempsDuJour save={save} now={now} />
      <ProchainPin save={save} onClick={() => naviguer({ nom: "pins" })} />
      <DefiEnCours save={save} onClick={() => naviguer({ nom: "defis" })} />
    </>
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-3 lg:max-w-6xl lg:px-8 lg:pt-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        <div className="grid min-w-0 gap-5">
          {/* Bannière */}
          <section className="relative overflow-hidden rounded-[2rem] p-5 shadow-[0_10px_28px_rgba(26,79,122,0.12)] sm:p-7">
            <DecorFond
              src={DECORS.accueil}
              position="70% 60%"
              voile="from-white/90 via-white/60 to-white/0"
              priorite
            />
            <div className="relative z-10 max-w-[64%] sm:max-w-[58%]">
              <h1 className="font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
                Bonjour,
                <br />
                <span className="text-ng-blue">{profil.pseudo}</span> <span aria-hidden>👋</span>
              </h1>
              <p className="mt-2 text-base font-bold text-ng-ink/80 sm:text-lg">
                Une mission de plus pour un quartier tout propre !
              </p>
              <div className="mt-4 max-w-xs">
                <Btn size="md" sound="pop" onClick={jouer}>
                  <IconPlay size={22} /> {prochaine ? "Continuer l'aventure" : "Rejouer"}
                </Btn>
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-0 right-1 flex items-end sm:right-6">
              <Mascot id="awa" pose="explique" size={150} float={false} className="hidden sm:block" />
              <Mascot id="kofi" pose="montre" size={165} float={false} className="sm:-ml-4" />
            </div>
          </section>

          {/* Continuer */}
          <section>
            <h2 className="mb-2 font-display text-2xl">Continuer</h2>
            {prochaine ? (
              <ContinuerCarte save={save} missionId={prochaine.id} onPlay={jouer} />
            ) : (
              <div className="card-ng flex items-center gap-3 p-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ng-green text-white">
                  <IconCheck size={28} />
                </span>
                <p className="font-display text-lg">
                  Tu as terminé tout le Village du Tri ! Rejoue pour gagner plus d&apos;étoiles.
                </p>
              </div>
            )}
          </section>

          {/* Sur téléphone et tablette portrait, les encarts viennent ici. */}
          <div className="grid gap-4 sm:grid-cols-2 lg:hidden">{encarts}</div>

          {/* Piliers */}
          <section>
            <h2 className="mb-2 font-display text-2xl">Les quatre mondes</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ZONES.map((zone) => {
                const ouverte = statutZone(zone.id) === "ouverte";
                const prog = progressionZone(save, zone.id);
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => ouvrirZone(zone)}
                    className="relative flex min-h-[150px] flex-col items-start justify-end gap-1 overflow-hidden rounded-3xl p-3 text-left shadow-[0_6px_18px_rgba(26,79,122,0.10)] transition-transform hover:-translate-y-0.5"
                    aria-label={ouverte ? `${zone.nom} : ${prog.terminees} missions sur ${prog.total}` : `${zone.nom} : bientôt`}
                  >
                    <DecorFond
                      src={zone.decor}
                      voile={ouverte ? "from-black/0 to-black/0" : "from-white/45 to-white/45"}
                    />
                    <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 to-transparent" aria-hidden />
                    <span
                      className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-xl text-white shadow-sm"
                      style={{ background: ouverte ? zone.couleur : "#8F857A" }}
                    >
                      {ouverte ? THEME_BY_ID[zone.pilier].icone : <IconLock size={20} />}
                    </span>
                    <span className="relative font-display text-lg leading-tight text-white">{NOMS_COURTS[zone.pilier]}</span>
                    <span className="relative text-sm font-bold text-white/90">
                      {ouverte ? `${prog.terminees}/${prog.total} missions` : "Bientôt"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Carte */}
          <section>
            <h2 className="mb-2 font-display text-2xl">La carte de l&apos;aventure</h2>
            <div className="card-ng mx-auto max-w-[540px] overflow-hidden p-0">
              <div className="relative">
                <MapScene />
                {ZONES.map((zone) => {
                  const pos = MAP_POSITIONS[zone.id];
                  const ouverte = statutZone(zone.id) === "ouverte";
                  const prog = progressionZone(save, zone.id);
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
                        onClick={() => ouvrirZone(zone)}
                        className="flex flex-col items-center"
                        aria-label={
                          ouverte
                            ? `${zone.nom} : ${prog.terminees} missions sur ${prog.total} terminées`
                            : `${zone.nom} : bientôt disponible`
                        }
                      >
                        <span
                          className={`flex h-[76px] w-[76px] items-center justify-center rounded-full border-[5px] border-white text-4xl shadow-[0_6px_0_rgba(45,42,38,0.18)] ${
                            ouverte ? "anim-glow" : ""
                          }`}
                          style={{ background: ouverte ? zone.couleur : "#CFC6B9" }}
                        >
                          {ouverte ? THEME_BY_ID[zone.pilier].icone : <IconLock size={34} className="text-white" />}
                        </span>
                        <span className="mt-1 max-w-[150px] rounded-2xl bg-white/95 px-3 py-1 text-center shadow-sm">
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
            </div>
          </section>
        </div>

        {/* Grand écran : colonne de droite */}
        <aside className="hidden content-start gap-5 lg:grid">{encarts}</aside>
      </div>

      {bientot ? (
        <Sheet label={bientot.nom} onClose={() => setBientot(null)}>
          <Illustration src={bientot.decor} ratio="16 / 9" className="mb-4 rounded-3xl" />
          <div className="flex items-center gap-3">
            <Mascot id="awa" pose="explique" size={110} />
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

/* ------------------------------ sous-parties ------------------------------ */

function ContinuerCarte({ save, missionId, onPlay }: { save: Sauvegarde; missionId: string; onPlay: () => void }) {
  const mission = prochaineMission(save)!;
  const zone = ZONE_BY_ID[mission.zoneId];
  const prog = progressionZone(save, mission.zoneId);
  const perso = SECONDARY_CHARACTERS[mission.personnageId];
  const pct = Math.round((prog.terminees / Math.max(1, prog.total)) * 100);
  return (
    <div className="card-ng flex flex-wrap items-center gap-4 p-3 sm:flex-nowrap sm:p-4" data-mission={missionId}>
      <div className="relative w-full shrink-0 sm:w-48">
        <Illustration src={mission.vignette} ratio="16 / 10" className="rounded-2xl" />
        <div className="absolute -bottom-3 -right-2">
          <CharacterMedallion id={mission.personnageId} size={52} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base text-ng-muted">
          {zone.nom} · Mission {mission.ordre}
        </p>
        <p className="font-display text-xl leading-tight">{mission.titre}</p>
        <p className="text-sm font-bold text-ng-muted">avec {perso?.nom}</p>
        <div className="mt-2 flex items-center gap-3">
          <ProgressBar value={prog.terminees} max={prog.total} color="bg-ng-blue" height="h-3" label="progression de la zone" />
          <span className="font-display text-sm text-ng-muted">{pct}%</span>
        </div>
      </div>
      <div className="w-full sm:w-auto">
        <Btn variant="blue" full sound="pop" onClick={onPlay}>
          <IconPlay size={20} /> Jouer
        </Btn>
      </div>
    </div>
  );
}

function TempsDuJour({ save, now }: { save: Sauvegarde; now: number }) {
  const L = limitesPour(save.profil!.tranche);
  const t = now ? normaliserTemps(save.temps, now, L) : save.temps;
  const max = limiteJour(t, L);
  const minutes = Math.round(t.secondesJour / 60);
  const ratio = Math.min(1, t.secondesJour / Math.max(1, max));
  const r = 42;
  const tour = 2 * Math.PI * r;
  const jours = now ? semaine(save, now) : [];
  const nbJours = jours.filter((j) => j.joue).length;
  return (
    <section className="card-ng p-5">
      <h2 className="font-display text-xl">Mon temps de jeu</h2>
      <div className="mt-3 flex items-center gap-4">
        <svg width="108" height="108" viewBox="0 0 108 108" role="img" aria-label={`${minutes} minutes sur ${Math.round(max / 60)} aujourd'hui`}>
          <circle cx="54" cy="54" r={r} fill="none" stroke="#E2F2FB" strokeWidth="11" />
          <circle
            cx="54"
            cy="54"
            r={r}
            fill="none"
            stroke="#1A6FA8"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${tour * ratio} ${tour}`}
            transform="rotate(-90 54 54)"
          />
          <text x="54" y="52" textAnchor="middle" className="font-display" fontSize="22" fill="#2D2A26">
            {minutes}
          </text>
          <text x="54" y="72" textAnchor="middle" fontSize="12" fontWeight="700" fill="#6B645C">
            / {Math.round(max / 60)} min
          </text>
        </svg>
        <p className="flex-1 font-bold text-ng-muted">
          Aujourd&apos;hui. Après le jeu, on bouge et on joue dehors !
        </p>
      </div>
      {jours.length ? (
        <>
          <ul className="mt-4 flex justify-between" aria-label="Jours joués cette semaine">
            {jours.map((j) => (
              <li key={j.jour} className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    j.joue ? "bg-ng-blue text-white" : "border-2 border-ng-ink/15 bg-white"
                  } ${j.aujourdhui ? "ring-2 ring-ng-yellow ring-offset-2" : ""}`}
                >
                  {j.joue ? <IconCheck size={16} strokeWidth={3.5} /> : null}
                </span>
                <span className="text-xs font-extrabold text-ng-muted">{j.initiale}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-bold text-ng-muted">
            {nbJours
              ? `Tu as joué ${nbJours} jour${nbJours > 1 ? "s" : ""} cette semaine. Bravo !`
              : "Joue une mission pour colorier ta première pastille."}
          </p>
        </>
      ) : null}
    </section>
  );
}

function ProchainPin({ save, onClick }: { save: Sauvegarde; onClick: () => void }) {
  const pin = prochainPin(save);
  if (!pin) return null;
  const prog = progressionPin(save, pin);
  return (
    <button type="button" onClick={onClick} className="card-ng hero-ng flex items-center gap-4 p-5 text-left">
      <PinBadge pin={pin} obtenu={false} size={84} />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm text-ng-muted">Prochain pin</p>
        <p className="font-display text-xl leading-tight">{pin.nom}</p>
        <p className="mt-1 text-sm font-bold text-ng-muted">{pin.commentObtenir}</p>
        <div className="mt-2 flex items-center gap-2">
          <ProgressBar value={prog.actuel} max={prog.cible} color="bg-ng-yellow" height="h-2.5" label={`progression vers ${pin.nom}`} />
          <span className="font-display text-sm text-ng-muted">
            {prog.actuel}/{prog.cible}
          </span>
        </div>
      </div>
    </button>
  );
}

function DefiEnCours({ save, onClick }: { save: Sauvegarde; onClick: () => void }) {
  const aFaire = Object.values(save.defis).filter((d) => d.statut === "accepte").length;
  const aValider = Object.values(save.defis).filter((d) => d.statut === "declare").length;
  if (!aFaire && !aValider) return null;
  return (
    <button type="button" onClick={onClick} className="card-ng flex items-center gap-3 p-5 text-left">
      <span className="text-4xl" aria-hidden>
        🌱
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg leading-tight">Mes défis du vrai monde</span>
        <span className="block text-sm font-bold text-ng-muted">
          {aFaire ? `${aFaire} à faire` : ""}
          {aFaire && aValider ? " · " : ""}
          {aValider ? `${aValider} à faire valider par un adulte` : ""}
        </span>
      </span>
    </button>
  );
}
