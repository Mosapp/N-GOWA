"use client";

import { Emblem } from "@/components/art/Scenes";
import { Btn, DecorFond, DECORS, Mascot, SpeechBubble } from "@/components/ui";
import { warmUpAudio } from "@/lib/audio";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const tailles = { sm: "text-3xl", md: "text-4xl", lg: "text-5xl" } as const;
  const embleme = { sm: 34, md: 42, lg: 52 } as const;
  return (
    <div className="flex items-center justify-center gap-2">
      <Emblem size={embleme[size]} />
      <span className={`font-display ${tailles[size]} leading-none tracking-tight`}>
        <span className="text-ng-green">N&apos;</span>
        <span className="text-ng-earth">GO</span>
        <span className="text-ng-blue">WA</span>
      </span>
    </div>
  );
}

const SLOGAN = "Apprendre. Jouer. Comprendre. Agir.";

/** Écran d'accueil immersif avec Kofi et Awa. */
export function Welcome({
  pseudo,
  onStart,
}: {
  pseudo: string | null;
  onStart: () => void;
}) {
  const message = pseudo
    ? `Te revoilà, ${pseudo} ! Le Village du Tri t'attend.`
    : "Bienvenue à N'GOWA ! Je suis Awa, et voici Kofi. Ensemble, on va protéger la nature de chez nous !";

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <DecorFond src={DECORS.accueil} position="60% 100%" voile="from-ng-cream/30 to-ng-cream/0" priorite />
      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-8 pt-8">
        <div className="anim-rise rounded-[2rem] bg-white/80 px-4 py-3 backdrop-blur-sm">
          <Logo size="lg" />
          <p className="mt-2 text-center font-display text-lg text-ng-green-dark">{SLOGAN}</p>
        </div>

        <div className="mt-5">
          <SpeechBubble qui="Awa" color="#7A4BC0" texteVoix={message}>
            <p>{message}</p>
          </SpeechBubble>
        </div>

        <div className="flex flex-1 items-end justify-center gap-2 pt-4">
          <Mascot id="awa" size={230} />
          <Mascot id="kofi" size={240} className="-ml-4" />
        </div>

        <div className="mt-4">
          <Btn
            size="lg"
            sound="pop"
            onClick={() => {
              warmUpAudio();
              onStart();
            }}
          >
            {pseudo ? "Continuer l'aventure" : "Commencer l'aventure"}
          </Btn>
        </div>
      </div>
    </main>
  );
}
