"use client";

import { useState } from "react";

import type { Naviguer } from "@/components/navigation";
import { Btn, Mascot, Sheet, SpeechBubble } from "@/components/ui";
import type { DefiReelContent } from "@/content/types";
import { DEFIS_REELS, MISSIONS } from "@/content/village";
import { accepterDefi, complexitePour, declarerDefi } from "@/lib/game/rules";
import type { Sauvegarde } from "@/lib/game/save";
import { modifierSauvegarde } from "@/lib/game/store";
import { playTone, speak } from "@/lib/audio";

function dateCourte(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

/**
 * Défis du vrai monde. Trois états bien distincts :
 * à faire → « je l'ai fait » (déclaré par l'enfant) → validé par un adulte.
 */
export function ChallengesScreen({ save, naviguer }: { save: Sauvegarde; naviguer: Naviguer }) {
  const [bravo, setBravo] = useState<DefiReelContent | null>(null);
  const petit = complexitePour(save.profil!.tranche) === "petit";
  const iso = () => new Date().toISOString();

  const debloques = DEFIS_REELS.filter(
    (d) => save.defis[d.id] || MISSIONS.some((m) => m.defiId === d.id && save.missions[m.id]?.terminee),
  );
  const nouveaux = debloques.filter((d) => !save.defis[d.id]);
  const aFaire = debloques.filter((d) => save.defis[d.id]?.statut === "accepte");
  const enAttente = debloques.filter((d) => save.defis[d.id]?.statut === "declare");
  const valides = debloques.filter((d) => save.defis[d.id]?.statut === "valide");
  const caches = DEFIS_REELS.length - debloques.length;

  const message = debloques.length
    ? "Les défis se font dans la vraie vie, avec ta famille. Pas besoin de photo !"
    : "Termine une mission du Village du Tri pour découvrir ton premier défi !";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-2 lg:max-w-5xl lg:px-8 lg:pt-8">
      <h1 className="font-display text-3xl">Mes défis du vrai monde</h1>
      <div className="mt-2 flex items-center gap-2">
        <Mascot id="kofi" size={80} />
        <div className="flex-1">
          <SpeechBubble qui="Kofi" size="sm" texteVoix={message}>
            <p>{message}</p>
          </SpeechBubble>
        </div>
      </div>

      {nouveaux.length ? (
        <Section titre="Nouveaux défis" emoji="✨">
          {nouveaux.map((d) => (
            <CarteDefi key={d.id} defi={d} petit={petit}>
              <Btn
                onClick={() => {
                  modifierSauvegarde((s) => accepterDefi(s, d.id, iso()));
                  playTone("pop");
                }}
              >
                Je relève le défi !
              </Btn>
            </CarteDefi>
          ))}
        </Section>
      ) : null}

      {aFaire.length ? (
        <Section titre="À faire" emoji="🌱">
          {aFaire.map((d) => (
            <CarteDefi key={d.id} defi={d} petit={petit}>
              <Btn
                sound="win"
                onClick={() => {
                  modifierSauvegarde((s) => declarerDefi(s, d.id, iso()));
                  setBravo(d);
                  speak("Bravo ! Maintenant, montre-le à un adulte pour qu'il le valide.");
                }}
              >
                Je l&apos;ai fait !
              </Btn>
            </CarteDefi>
          ))}
        </Section>
      ) : null}

      {enAttente.length ? (
        <Section titre="Un adulte doit valider" emoji="🤝">
          {enAttente.map((d) => (
            <CarteDefi key={d.id} defi={d} petit={petit} note={`Tu l'as fait le ${dateCourte(save.defis[d.id].declareLe)}.`}>
              <Btn variant="blue" onClick={() => naviguer({ nom: "parent", defiId: d.id })}>
                Montrer à un adulte
              </Btn>
            </CarteDefi>
          ))}
        </Section>
      ) : null}

      {valides.length ? (
        <Section titre="Validés par un adulte" emoji="🏅">
          {valides.map((d) => (
            <CarteDefi
              key={d.id}
              defi={d}
              petit={petit}
              valide
              note={`Validé le ${dateCourte(save.defis[d.id].valideLe)}. Continue ce geste chaque jour !`}
            />
          ))}
        </Section>
      ) : null}

      {caches > 0 ? (
        <p className="mt-6 rounded-2xl bg-white/70 p-3 text-center font-bold text-ng-muted">
          🔒 {caches} défi{caches > 1 ? "s" : ""} à découvrir en terminant des missions.
        </p>
      ) : null}

      {bravo ? (
        <Sheet label="Bravo" onClose={() => setBravo(null)}>
          <div className="flex flex-col items-center text-center">
            <Mascot id="awa" size={140} humeur="joie" />
            <h2 className="mt-2 font-display text-3xl">Bravo !</h2>
            <p className="mt-2 text-lg font-bold">
              Tu dis avoir fait « {bravo.titre} ». Montre-le à un adulte : il pourra le valider dans l&apos;espace parent.
            </p>
            <div className="mt-5 grid w-full gap-2">
              <Btn variant="blue" onClick={() => naviguer({ nom: "parent", defiId: bravo.id })}>
                Montrer à un adulte maintenant
              </Btn>
              <Btn variant="white" onClick={() => setBravo(null)}>
                Plus tard
              </Btn>
            </div>
          </div>
        </Sheet>
      ) : null}
    </main>
  );
}

function Section({ titre, emoji, children }: { titre: string; emoji: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 font-display text-2xl">
        <span aria-hidden>{emoji} </span>
        {titre}
      </h2>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function CarteDefi({
  defi,
  petit,
  note,
  valide,
  children,
}: {
  defi: DefiReelContent;
  petit: boolean;
  note?: string;
  valide?: boolean;
  children?: React.ReactNode;
}) {
  const consigne = defi.consigne[petit ? "petit" : "grand"];
  return (
    <article className={`card-ng p-4 ${valide ? "border-ng-leaf bg-ng-leaf-soft" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="text-4xl" aria-hidden>
          {defi.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl leading-tight">{defi.titre}</h3>
          <p className="mt-1 text-lg font-bold leading-snug">{consigne}</p>
          {!valide ? <p className="mt-2 text-sm font-bold text-ng-coral-dark">⚠️ {defi.securite}</p> : null}
          {note ? <p className="mt-2 font-bold text-ng-muted">{note}</p> : null}
        </div>
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </article>
  );
}
