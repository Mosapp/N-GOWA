"use client";

import { Bin } from "@/components/art/Bin";
import { LIT } from "@/components/game/RiverGame";
import { LUMIERES } from "@/components/game/SwitchGame";
import { Btn, Confetti, Mascot, useDireAuMontage } from "@/components/ui";
import type { ZoneId } from "@/content/types";
import { BACS } from "@/content/village";
import { ZONES } from "@/content/zones";

/** Ce que l'enfant a changé dans chaque monde, dit à voix haute. */
const MESSAGES: Record<ZoneId, { titre: string; texte: string }> = {
  "village-tri": { titre: "Le village est tout propre !", texte: "Grâce à toi, chaque déchet est dans la bonne poubelle." },
  "riviere-vivante": { titre: "La rivière est redevenue claire !", texte: "Grâce à toi, l'eau est propre et les poissons sont heureux." },
  "foret-decouvertes": { titre: "Les animaux ont retrouvé leur maison !", texte: "Grâce à toi, la nature est protégée." },
  "royaume-energie": { titre: "Tout le village est éclairé !", texte: "Grâce à toi, on a de la lumière sans gaspiller." },
};

/** Animaux de la Forêt, chacun dans son habitat (en % du décor « habitats »). */
const ANIMAUX: [string, number, number, number][] = [
  ["chimpanze", 14, 36, 17], ["perroquet-gris", 33, 20, 12], ["hippo-nain", 34, 40, 15],
  ["elephant", 64, 34, 19], ["buffle", 85, 40, 15], ["antilope", 78, 22, 12],
  ["crocodile", 14, 74, 17], ["tortue", 30, 86, 13], ["poisson", 34, 64, 11],
  ["papillon", 66, 62, 11], ["abeille", 88, 66, 9], ["margouillat", 74, 86, 13],
];

function Scene({ zoneId }: { zoneId: ZoneId }) {
  const fond = {
    "village-tri": "/illustrations/scenes/marche-adjoua.webp",
    "riviere-vivante": "/illustrations/scenes/riviere.webp",
    "foret-decouvertes": "/illustrations/scenes/habitats.webp",
    "royaume-energie": "/illustrations/scenes/village-nuit.webp",
  }[zoneId];
  return (
    <div className="relative mx-auto aspect-[3/4] h-[52dvh] max-h-[560px] min-h-[300px] overflow-hidden rounded-[2rem] border-4 border-white shadow-lg">
      {/* eslint-disable-next-line @next/next/no-img-element -- décor local */}
      <img src={fond} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />

      {zoneId === "village-tri" ? (
        // Les poubelles bien rangées, sans un déchet par terre.
        <div className="absolute inset-x-0 bottom-[6%] flex justify-center gap-[2%]">
          {(["plastique", "papier", "verre", "restes"] as const).map((id, i) => (
            <div key={id} className="anim-pop" style={{ animationDelay: `${0.2 + i * 0.15}s` }}>
              <Bin bac={BACS[id]} size={64} />
            </div>
          ))}
        </div>
      ) : null}

      {zoneId === "riviere-vivante" ? (
        <>
          <div
            className="absolute inset-y-0"
            style={{
              left: `${LIT[0]}%`,
              width: `${LIT[2] - LIT[0]}%`,
              background: "linear-gradient(to right, transparent, rgba(40,150,215,0.8) 22%, rgba(40,150,215,0.8) 78%, transparent)",
              mixBlendMode: "color",
              opacity: 0.75,
            }}
          />
          {[22, 48, 74].map((y, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- poisson dessiné
            <img
              key={y}
              src="/illustrations/objets/poisson.webp"
              alt=""
              className="anim-saut absolute w-[18%]"
              style={{ left: `${42 + (i % 2) * 6}%`, top: `${y}%`, animationDelay: `${i * 0.7}s` }}
            />
          ))}
        </>
      ) : null}

      {zoneId === "foret-decouvertes"
        ? ANIMAUX.map(([id, x, y, t], i) => (
            // eslint-disable-next-line @next/next/no-img-element -- animal dessiné
            <img
              key={id}
              src={`/illustrations/objets/${id}.webp`}
              alt=""
              className="anim-pop absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${t}%`,
                animationDelay: `${0.2 + i * 0.12}s`,
                filter: "drop-shadow(0 3px 2px rgba(0,0,0,0.3))",
              }}
            />
          ))
        : null}

      {zoneId === "royaume-energie" ? (
        <>
          {LUMIERES.map(([x, y], i) => (
            <span
              key={i}
              className="anim-allume absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: "16%",
                aspectRatio: "1",
                background: "radial-gradient(circle, rgba(255,214,120,0.95) 0%, rgba(255,170,60,0.55) 35%, transparent 70%)",
                mixBlendMode: "screen",
                animationDelay: `${0.2 + i * 0.12}s`,
              }}
            />
          ))}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(255,170,70,0.35), transparent 60%)" }} />
        </>
      ) : null}
    </div>
  );
}

/**
 * Fête de fin de monde : la première fois qu'un monde est terminé, on montre
 * ce que l'enfant a changé (village propre, rivière bleue, forêt habitée,
 * village éclairé) et le monde suivant qui s'ouvre.
 */
export function FinDeMonde({ zoneId, onContinue }: { zoneId: ZoneId; onContinue: () => void }) {
  const { titre, texte } = MESSAGES[zoneId];
  const index = ZONES.findIndex((z) => z.id === zoneId);
  const suivante = ZONES[index + 1];
  const suite = suivante ? `${suivante.nom} t'attend !` : "Tu as terminé toute l'aventure N'GOWA !";
  useDireAuMontage(`Bravo ! ${titre} ${texte} ${suite}`);

  return (
    <section className="anim-rise flex flex-col items-center text-center">
      <Confetti />
      <h1 className="font-display text-3xl leading-tight">{titre}</h1>
      <div className="relative mt-3 w-full">
        <Scene zoneId={zoneId} />
        <div className="pointer-events-none absolute -bottom-4 left-0 right-0 flex justify-between px-1">
          <Mascot id="awa" size={110} pose="bravo" />
          <Mascot id="kofi" size={110} pose="bravo" />
        </div>
      </div>
      <p className="mt-6 font-display text-xl text-ng-green-dark">{suite}</p>
      <div className="mt-4 w-full">
        <Btn size="lg" onClick={onContinue}>
          Continuer
        </Btn>
      </div>
    </section>
  );
}
