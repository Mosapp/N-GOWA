"use client";

import { IconCheck, IconLock, IconStar } from "@/components/icons";
import { Avatar } from "@/components/ui";
import { THEME_BY_ID } from "@/content/curriculum";
import type { ZoneContent, ZoneId } from "@/content/types";
import { ZONES } from "@/content/zones";
import { progressionZone, statutZone } from "@/lib/game/rules";
import type { AvatarId, Sauvegarde } from "@/lib/game/save";

/**
 * Carte illustrée de l'aventure. Deux images : portrait (téléphone) et
 * paysage (grand écran). Les boutons des zones sont posés sur les clairières
 * de l'illustration ; les zones fermées sont couvertes d'une brume légère.
 */

type Position = { x: number; y: number };

/** Noms courts, lisibles sur la carte (le nom complet est dans l'étiquette d'accessibilité). */
const NOMS_COURTS: Record<ZoneId, string> = {
  "village-tri": "Le Village",
  "riviere-vivante": "La Rivière",
  "foret-decouvertes": "La Forêt",
  "royaume-energie": "L'Énergie",
};

const CARTES = {
  portrait: {
    src: "/illustrations/decors/carte-portrait.webp",
    largeur: 896,
    hauteur: 1200,
    positions: {
      "village-tri": { x: 27.3, y: 73.6 },
      "riviere-vivante": { x: 80.2, y: 74 },
      "foret-decouvertes": { x: 30, y: 40.4 },
      "royaume-energie": { x: 75.8, y: 23.6 },
    } as Record<ZoneId, Position>,
  },
  paysage: {
    src: "/illustrations/decors/carte-paysage.webp",
    largeur: 1376,
    hauteur: 768,
    positions: {
      "village-tri": { x: 19.6, y: 52.5 },
      "riviere-vivante": { x: 47.6, y: 66.5 },
      "foret-decouvertes": { x: 63.2, y: 44 },
      "royaume-energie": { x: 87.9, y: 52 },
    } as Record<ZoneId, Position>,
  },
};

export function CarteAventure({
  save,
  zoneActuelle,
  onZone,
}: {
  save: Sauvegarde;
  /** Zone où se trouve l'enfant (prochaine mission). */
  zoneActuelle: ZoneId;
  onZone: (zone: ZoneContent) => void;
}) {
  const avatar = save.profil!.avatar;
  return (
    <>
      <div className="lg:hidden">
        <Carte format="portrait" save={save} avatar={avatar} zoneActuelle={zoneActuelle} onZone={onZone} />
      </div>
      <div className="hidden lg:block">
        <Carte format="paysage" save={save} avatar={avatar} zoneActuelle={zoneActuelle} onZone={onZone} />
      </div>
    </>
  );
}

function Carte({
  format,
  save,
  avatar,
  zoneActuelle,
  onZone,
}: {
  format: keyof typeof CARTES;
  save: Sauvegarde;
  avatar: AvatarId;
  zoneActuelle: ZoneId;
  onZone: (zone: ZoneContent) => void;
}) {
  const carte = CARTES[format];
  return (
    <div
      className="relative w-full overflow-hidden rounded-[2rem] shadow-[0_12px_32px_rgba(26,79,122,0.16)]"
      style={{ aspectRatio: `${carte.largeur} / ${carte.hauteur}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- carte locale optimisée, mise en cache hors ligne */}
      <img
        src={carte.src}
        alt="Carte de l'aventure N'GOWA : le village, la rivière, la forêt et le royaume de l'énergie"
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        draggable={false}
      />

      {/* Brume sur les zones fermées */}
      {ZONES.map((zone) => {
        if (statutZone(save, zone.id) === "ouverte") return null;
        const pos = carte.positions[zone.id];
        return (
          <div
            key={`brume-${zone.id}`}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: format === "portrait" ? "62%" : "34%",
              aspectRatio: "1 / 0.8",
              background: "radial-gradient(closest-side, rgba(255,250,240,0.82), rgba(255,250,240,0.55) 55%, rgba(255,250,240,0) 100%)",
            }}
            aria-hidden
          />
        );
      })}

      {/* Boutons des zones */}
      {ZONES.map((zone) => (
        <MarqueurZone
          key={zone.id}
          zone={zone}
          save={save}
          position={carte.positions[zone.id]}
          ici={zone.id === zoneActuelle}
          compact={format === "portrait"}
          avatar={avatar}
          onClick={() => onZone(zone)}
        />
      ))}
    </div>
  );
}

function MarqueurZone({
  zone,
  save,
  position,
  ici,
  compact,
  avatar,
  onClick,
}: {
  zone: ZoneContent;
  save: Sauvegarde;
  position: Position;
  ici: boolean;
  compact: boolean;
  avatar: AvatarId;
  onClick: () => void;
}) {
  const statut = statutZone(save, zone.id);
  const prog = progressionZone(save, zone.id);
  const ouverte = statut === "ouverte";
  const terminee = ouverte && prog.terminees >= prog.total;
  const etat = statut === "verrouillee" ? "À débloquer" : statut === "bientot" ? "Bientôt" : null;

  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
    >
      {ici ? (
        <div className={`anim-float absolute z-10 ${compact ? "-top-[2.9rem]" : "-top-[3.4rem]"}`} aria-hidden>
          <div className="rounded-full bg-white p-0.5 shadow-lg">
            <Avatar id={avatar} size={compact ? 36 : 44} />
          </div>
          <div className="mx-auto -mt-1 h-3 w-3 rotate-45 bg-white shadow" />
        </div>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        className="group flex flex-col items-center"
        aria-label={
          ouverte
            ? `${zone.nom} : ${prog.terminees} missions sur ${prog.total} terminées`
            : `${zone.nom} : ${etat?.toLowerCase()}`
        }
      >
        <span
          className={`relative flex items-center justify-center rounded-full border-[4px] border-white shadow-[0_6px_14px_rgba(0,0,0,0.25)] transition-transform group-hover:scale-105 group-active:scale-95 ${
            compact ? "h-[52px] w-[52px] text-2xl" : "h-[64px] w-[64px] text-3xl"
          } ${
            ici ? "anim-glow" : ""
          }`}
          style={{ background: ouverte ? zone.couleur : "#A79C8E" }}
        >
          {ouverte ? THEME_BY_ID[zone.pilier].icone : <IconLock size={compact ? 22 : 28} className="text-white" />}
          {terminee ? (
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-ng-green text-white">
              <IconCheck size={14} strokeWidth={3.5} />
            </span>
          ) : null}
        </span>
        <span className="mt-1 max-w-[150px] whitespace-nowrap rounded-2xl bg-white/95 px-2.5 py-0.5 text-center shadow-md">
          <span className={`block font-display leading-tight ${compact ? "text-sm" : "text-[15px]"}`}>
            {NOMS_COURTS[zone.id]}
          </span>
          {ouverte ? (
            <span className="flex items-center justify-center gap-1 font-display text-xs text-ng-muted">
              <IconStar size={13} /> {prog.etoiles}/{prog.etoilesMax}
            </span>
          ) : (
            <span className="block font-display text-xs text-ng-muted">{etat}</span>
          )}
        </span>
      </button>
    </div>
  );
}
