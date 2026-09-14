
"use client";

import { useEffect, useState } from "react";

import { Btn, Mascot, ProgressBar, SpeechBubble } from "@/components/ui";
import { AVATARS } from "@/content/badges";
import { playTone, speak, warmUpAudio } from "@/lib/audio";
import type { AppState } from "@/lib/types";

const AGES = [4, 5, 6, 7, 8, 9, 10];

export function Onboarding({
  onCreated,
}: {
  onCreated: (profileId: number, state: AppState) => void;
}) {
  const [step, setStep] = useState(0);
  const [pseudo, setPseudo] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [avatar, setAvatar] = useState<string>("kofi");
  const [langueLocale, setLangueLocale] = useState("dioula");
  const [parentPin, setParentPin] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step === 0) {
      speak(
        "Bienvenue dans Ngowa ! Je suis Kofi. On va apprendre ensemble à protéger la nature.",
      );
    }
  }, [step]);

  const canContinue = (() => {
    if (step === 1) return pseudo.trim().length >= 2;

    if (step === 2) return age !== null;

    if (step === 5) {
      return (
        /^\d{4}$/.test(parentPin) &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)
      );
    }

    return true;
  })();

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudo: pseudo.trim(),
          age,
          avatar,
          langueLocale,
          parentPin,
          parentEmail: parentEmail.trim().toLowerCase(),
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        profile?: { id: number };
        state?: AppState;
      };

      if (!response.ok || !data.profile || !data.state) {
        setError(data.error ?? "Oups, réessaie !");
        return;
      }

      playTone("win");
      onCreated(data.profile.id, data.state);
    } catch {
      setError("Pas de connexion. Réessaie !");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-6">
      <div className="mb-6">
        <Logo />

        <div className="mt-4">
          <ProgressBar
            value={step + 1}
            max={7}
            color="bg-ng-orange"
            height="h-3"
            label="étapes de création"
          />
        </div>
      </div>

      <div className="flex-1">
        {/* 1. Bienvenue */}
        {step === 0 ? (
          <div className="anim-rise flex flex-col items-center text-center">
            <div className="flex items-end gap-1">
              <Mascot id="awa" size={110} />
              <Mascot id="kofi" size={150} />
              <Mascot id="coco" size={95} />
            </div>

            <h1 className="mt-4 font-display text-3xl leading-tight">
              Salut ! On part en aventure ?
            </h1>

            <div className="mt-4 w-full">
              <SpeechBubble>
                <p>
                  Je suis <strong>Kofi</strong>, voici <strong>Awa</strong> et{" "}
                  <strong>Coco</strong>. Avec N&apos;GOWA, on découvre la nature
                  de chez nous, on joue, on apprend des mots et… on agit pour
                  de vrai !
                </p>
              </SpeechBubble>
            </div>

            <p className="mt-4 font-display text-sm uppercase tracking-widest text-ng-green">
              Apprendre · Jouer · Découvrir · Agir
            </p>
          </div>
        ) : null}

        {/* 2. Pseudo */}
        {step === 1 ? (
          <div className="anim-rise">
            <Mascot id="kofi" size={110} className="mx-auto" />

            <h2 className="mt-3 text-center font-display text-2xl">
              Comment tu t&apos;appelles ?
            </h2>

            <input
              value={pseudo}
              onChange={(event) =>
                setPseudo(event.target.value.slice(0, 20))
              }
              placeholder="Ton prénom"
              maxLength={20}
              autoComplete="off"
              className="mt-5 w-full rounded-3xl border-3 border-ng-ink/15 bg-white px-5 py-4 text-center font-display text-2xl outline-none focus:border-ng-orange"
            />

            <p className="mt-3 text-center text-xs font-bold uppercase tracking-wide text-ng-ink/40">
              Ton prénom reste sur cet appareil
            </p>
          </div>
        ) : null}

        {/* 3. Âge */}
        {step === 2 ? (
          <div className="anim-rise">
            <Mascot id="awa" size={110} className="mx-auto" />

            <h2 className="mt-3 text-center font-display text-2xl">
              Quel âge as-tu ?
            </h2>

            <p className="mt-1 text-center text-sm font-semibold text-ng-ink/60">
              Pour adapter les missions et le temps d&apos;écran.
            </p>

            <div className="mt-5 grid grid-cols-4 gap-3">
              {AGES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setAge(value);
                    playTone("tap");
                  }}
                  className={`btn3d tap-target flex items-center justify-center py-4 text-2xl ${age === value
                    ? "border-ng-blue-dark bg-ng-blue text-white"
                    : "border-ng-ink/15 bg-white text-ng-ink"
                    }`}
                >
                  {value}
                </button>
              ))}
            </div>

            {age ? (
              <p className="mt-4 text-center font-display text-sm text-ng-green">
                Parfait ! Niveau de difficulté :{" "}
                {age <= 6 ? "DÉCOUVRIR" : age <= 8 ? "COMPRENDRE" : "AGIR"}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* 4. Avatar */}
        {step === 3 ? (
          <div className="anim-rise">
            <h2 className="text-center font-display text-2xl">
              Choisis ton avatar
            </h2>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {AVATARS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setAvatar(option.id);
                    playTone("pop");
                  }}
                  className={`btn3d flex flex-col items-center gap-1 py-4 ${avatar === option.id
                    ? "border-ng-orange-dark bg-ng-yellow text-ng-ink"
                    : "border-ng-ink/15 bg-white text-ng-ink"
                    }`}
                >
                  <span className="text-4xl">{option.emoji}</span>
                  <span className="font-display text-sm">{option.nom}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* 5. Langue */}
        {step === 4 ? (
          <div className="anim-rise">
            <Mascot id="coco" size={110} className="mx-auto" />

            <h2 className="mt-3 text-center font-display text-2xl">
              Ta langue d&apos;aventure
            </h2>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => setLangueLocale("dioula")}
                className={`btn3d flex items-center gap-3 px-4 py-4 text-left normal-case ${langueLocale === "dioula"
                  ? "border-ng-purple-dark bg-ng-purple text-white"
                  : "border-ng-ink/15 bg-white text-ng-ink"
                  }`}
              >
                <span className="text-3xl">🗣️</span>

                <span>
                  <span className="block font-display text-base">
                    Français + Dioula
                  </span>

                  <span className="block text-xs font-bold opacity-70">
                    Les mots EcoLangues en dioula
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLangueLocale("baoule")}
                className={`btn3d flex items-center gap-3 px-4 py-4 text-left normal-case ${langueLocale === "baoule"
                  ? "border-ng-purple-dark bg-ng-purple text-white"
                  : "border-ng-ink/15 bg-white text-ng-ink"
                  }`}
              >
                <span className="text-3xl">🔜</span>

                <span>
                  <span className="block font-display text-base">
                    Français + Baoulé
                  </span>

                  <span className="block text-xs font-bold opacity-70">
                    Bientôt, après validation des traductions
                  </span>
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {/* 6. Code parent */}
        {step === 5 ? (
          <div className="anim-rise">
            <h2 className="text-center font-display text-2xl">
              Espace parent
            </h2>

            <p className="mt-1 text-center text-sm font-semibold text-ng-ink/60">
              Ton e-mail permettra de récupérer ton code PIN si tu l&apos;oublies.
            </p>

            {/* E-mail parent */}
            <input
              type="email"
              value={parentEmail}
              onChange={(event) => setParentEmail(event.target.value)}
              placeholder="E-mail du parent"
              autoComplete="email"
              className="mt-5 w-full rounded-3xl border-3 border-ng-ink/15 bg-white px-5 py-4 text-center font-display text-lg outline-none focus:border-ng-orange"
            />

            {/* Code PIN */}
            <input
              value={parentPin}
              onChange={(event) =>
                setParentPin(
                  event.target.value.replace(/\D/g, "").slice(0, 4),
                )
              }
              inputMode="numeric"
              placeholder="Code PIN à 4 chiffres"
              maxLength={4}
              autoComplete="off"
              className="mt-4 w-full rounded-3xl border-3 border-ng-ink/15 bg-white px-5 py-4 text-center font-display text-3xl tracking-[0.5em] outline-none focus:border-ng-orange"
            />

            <p className="mt-3 text-center text-xs font-bold uppercase tracking-wide text-ng-ink/40">
              Garde ton code PIN en sécurité.
            </p>
          </div>
        ) : null}

        {/* 7. Départ */}
        {step === 6 ? (
          <div className="anim-rise flex flex-col items-center text-center">
            <div className="flex items-end">
              <Mascot
                id={avatar === "awa" ? "awa" : "kofi"}
                size={140}
              />
              <Mascot id="coco" size={100} />
            </div>

            <h2 className="mt-3 font-display text-2xl">
              Prêt·e, {pseudo.trim() || "ami·e"} ?
            </h2>

            <div className="mt-4 w-full">
              <SpeechBubble color="#58CC02">
                <p>
                  Ta première mission t&apos;attend ! On va découvrir un monde
                  de N&apos;GOWA, jouer, et faire une vraie mission à la maison.
                </p>
              </SpeechBubble>
            </div>

            <div className="mt-5 grid w-full grid-cols-3 gap-2 text-center font-display text-xs uppercase">
              <div className="card-soft p-3">Avatar {avatar}</div>
              <div className="card-soft p-3">{age} ans</div>
              <div className="card-soft p-3">
                {langueLocale === "dioula" ? "Dioula" : "Baoulé"}
              </div>
            </div>

            {error ? (
              <p className="mt-3 font-display text-sm text-ng-red">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3">
        {step < 6 ? (
          <Btn
            size="lg"
            disabled={!canContinue}
            onClick={() => {
              warmUpAudio();
              setStep(step + 1);
            }}
          >
            Continuer
          </Btn>
        ) : (
          <Btn size="lg" disabled={loading} onClick={submit}>
            {loading ? "Création…" : "Commencer l'aventure !"}
          </Btn>
        )}

        {step > 0 && step < 6 ? (
          <Btn variant="white" onClick={() => setStep(step - 1)}>
            Retour
          </Btn>
        ) : null}
      </div>
    </div>
  );
}

export function Logo({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-5xl",
  } as const;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        <span className="text-3xl">🌍</span>

        <h1 className={`font-display ${sizes[size]} tracking-tight`}>
          <span className="text-ng-green">N&apos;</span>
          <span className="text-ng-orange">GOW</span>
          <span className="text-ng-blue">A</span>
        </h1>
      </div>

      <div className="kente mt-1 h-1.5 w-40 rounded-full" />
    </div>
  );
}