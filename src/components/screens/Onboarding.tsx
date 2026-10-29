"use client";

import { useState } from "react";

import { IconBack } from "@/components/icons";
import { Avatar, AVATARS, Btn, Mascot, ProgressBar, SpeechBubble, useDireAuMontage } from "@/components/ui";
import type { TrancheAge } from "@/content/types";
import { nettoyerPseudo, type AvatarId, type Profil } from "@/lib/game/save";
import { playTone } from "@/lib/audio";

const SUGGESTIONS = ["Petit Baobab", "Étoile du Tri", "Super Mangue", "Calao Malin", "Goutte d'Or", "Lion Doux"];

const TRANCHES: { id: TrancheAge; titre: string; sousTitre: string; emoji: string; minutes: string }[] = [
  { id: "4-5", titre: "4 ou 5 ans", sousTitre: "Je découvre", emoji: "🌱", minutes: "15 min par session" },
  { id: "6-8", titre: "6, 7 ou 8 ans", sousTitre: "Je comprends", emoji: "🌿", minutes: "20 min par session" },
  { id: "9-10", titre: "9 ou 10 ans", sousTitre: "J'agis", emoji: "🌳", minutes: "30 min par session" },
];

const DECOUVERTE = [
  {
    mascotte: "kofi" as const,
    titre: "Explore la carte",
    texte: "Quatre zones à découvrir ! On commence par le Village du Tri.",
    emoji: "🗺️",
  },
  {
    mascotte: "awa" as const,
    titre: "Joue et apprends",
    texte: "Chaque mission est un petit jeu. Tu gagnes des points et de beaux pins.",
    emoji: "🏅",
  },
  {
    mascotte: "kofi" as const,
    titre: "Agis pour de vrai",
    texte: "Après le jeu, relève un défi à la maison. Un adulte pourra le valider.",
    emoji: "🌱",
  },
];

/**
 * Création du profil local en trois étapes : avatar + surnom, tranche
 * d'âge, découverte. Aucune adresse e-mail, aucun compte.
 */
export function Onboarding({
  onDone,
  onCancel,
}: {
  onDone: (profil: Omit<Profil, "creeLe">) => void;
  onCancel: () => void;
}) {
  const [etape, setEtape] = useState(0);
  const [avatar, setAvatar] = useState<AvatarId>("kofi");
  const [pseudo, setPseudo] = useState("");
  const [tranche, setTranche] = useState<TrancheAge | null>(null);
  const [slide, setSlide] = useState(0);

  const pseudoPropre = nettoyerPseudo(pseudo);
  const voix =
    etape === 0
      ? "Choisis ton personnage, puis ton surnom."
      : etape === 1
        ? "Quel âge as-tu ?"
        : `${DECOUVERTE[slide].titre}. ${DECOUVERTE[slide].texte}`;
  useDireAuMontage(voix);

  const retour = () => {
    if (etape === 0) onCancel();
    else if (etape === 2 && slide > 0) setSlide(slide - 1);
    else setEtape(etape - 1);
  };

  const terminer = () => {
    if (!tranche || pseudoPropre.length < 2) return;
    playTone("win");
    onDone({ pseudo: pseudoPropre, avatar, tranche });
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-5 pb-6 pt-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={retour}
          className="tap-target flex items-center justify-center rounded-2xl bg-white shadow-[0_3px_0_rgba(45,42,38,0.1)]"
          aria-label="Retour"
        >
          <IconBack size={30} />
        </button>
        <div className="flex-1">
          <ProgressBar value={etape + 1} max={3} color="bg-ng-yellow" height="h-4" label="étapes" />
        </div>
      </div>

      {/* 1. Avatar + surnom */}
      {etape === 0 ? (
        <section className="anim-rise mt-5 flex flex-1 flex-col">
          <h1 className="text-center font-display text-3xl">Choisis ton personnage</h1>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {AVATARS.map((a) => {
              const choisi = avatar === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    playTone("pop");
                    setAvatar(a.id);
                  }}
                  aria-pressed={choisi}
                  className={`flex flex-col items-center gap-1 rounded-3xl border-4 p-2 pb-3 transition-transform ${
                    choisi ? "scale-105 border-ng-yellow bg-ng-sun-soft" : "border-transparent bg-white"
                  }`}
                >
                  <Avatar id={a.id} size={74} />
                  <span className="font-display text-base">{a.nom}</span>
                </button>
              );
            })}
          </div>

          <label htmlFor="pseudo" className="mt-6 block text-center font-display text-2xl">
            Ton surnom
          </label>
          <input
            id="pseudo"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value.slice(0, 20))}
            placeholder="Écris ou choisis"
            maxLength={20}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="done"
            className="mt-2 w-full rounded-3xl border-4 border-ng-ink/10 bg-white px-5 py-3 text-center font-display text-2xl outline-none focus:border-ng-yellow"
          />
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  playTone("tap");
                  setPseudo(s);
                }}
                className="min-h-[44px] rounded-full bg-white px-4 font-display text-base shadow-[0_3px_0_rgba(45,42,38,0.08)]"
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-sm font-bold text-ng-muted">
            Un surnom suffit, pas ton nom de famille. Il reste sur cet appareil.
          </p>

          <div className="mt-auto pt-5">
            <Btn size="lg" disabled={pseudoPropre.length < 2} onClick={() => setEtape(1)}>
              Continuer
            </Btn>
          </div>
        </section>
      ) : null}

      {/* 2. Tranche d'âge */}
      {etape === 1 ? (
        <section className="anim-rise mt-5 flex flex-1 flex-col">
          <div className="flex items-end justify-center gap-3">
            <Avatar id={avatar} size={72} />
            <h1 className="font-display text-3xl">Quel âge as-tu ?</h1>
          </div>
          <div className="mt-6 grid gap-3">
            {TRANCHES.map((t) => {
              const choisi = tranche === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={choisi}
                  onClick={() => {
                    playTone("pop");
                    setTranche(t.id);
                  }}
                  className={`flex min-h-[84px] items-center gap-4 rounded-3xl border-4 px-4 text-left transition-transform ${
                    choisi ? "scale-[1.02] border-ng-green bg-ng-leaf-soft" : "border-transparent bg-white"
                  }`}
                >
                  <span className="text-5xl" aria-hidden>
                    {t.emoji}
                  </span>
                  <span className="flex-1">
                    <span className="block font-display text-2xl leading-tight">{t.titre}</span>
                    <span className="block font-bold text-ng-muted">{t.sousTitre}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-center text-sm font-bold text-ng-muted">
            Les missions et le temps de jeu s&apos;adaptent à ton âge.
          </p>
          <div className="mt-auto pt-5">
            <Btn size="lg" disabled={!tranche} onClick={() => setEtape(2)}>
              Continuer
            </Btn>
          </div>
        </section>
      ) : null}

      {/* 3. Découverte de N'GOWA */}
      {etape === 2 ? (
        <section key={slide} className="anim-rise mt-5 flex flex-1 flex-col items-center text-center">
          <span className="text-6xl" aria-hidden>
            {DECOUVERTE[slide].emoji}
          </span>
          <h1 className="mt-2 font-display text-3xl">{DECOUVERTE[slide].titre}</h1>
          <div className="mt-4 w-full text-left">
            <SpeechBubble
              qui={DECOUVERTE[slide].mascotte === "kofi" ? "Kofi" : "Awa"}
              color={DECOUVERTE[slide].mascotte === "kofi" ? "#E0762E" : "#7A4BC0"}
              texteVoix={DECOUVERTE[slide].texte}
            >
              <p>{DECOUVERTE[slide].texte}</p>
            </SpeechBubble>
          </div>
          <div className="flex flex-1 items-end justify-center pt-4">
            <Mascot id={DECOUVERTE[slide].mascotte} size={200} />
          </div>
          <div className="mt-3 flex justify-center gap-2" aria-hidden>
            {DECOUVERTE.map((_, i) => (
              <span key={i} className={`h-3 rounded-full ${i === slide ? "w-8 bg-ng-green" : "w-3 bg-ng-ink/15"}`} />
            ))}
          </div>
          <div className="mt-4 grid w-full gap-2">
            {slide < DECOUVERTE.length - 1 ? (
              <>
                <Btn size="lg" onClick={() => setSlide(slide + 1)}>
                  Suivant
                </Btn>
                <Btn variant="white" onClick={terminer}>
                  Passer
                </Btn>
              </>
            ) : (
              <Btn size="lg" sound="none" onClick={terminer}>
                C&apos;est parti !
              </Btn>
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
