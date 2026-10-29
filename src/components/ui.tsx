"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { IconBack, IconSound, IconStar } from "@/components/icons";
import { MASCOTS, SECONDARY_CHARACTERS, type MascotId } from "@/content/characters";
import type { AvatarId } from "@/lib/game/save";
import { playTone, speak, type Tone } from "@/lib/audio";

/* -------------------------------- Bouton --------------------------------- */

type Variant = "green" | "blue" | "yellow" | "orange" | "red" | "purple" | "coral" | "white";

const VARIANTS: Record<Variant, string> = {
  green: "bg-ng-green text-white",
  blue: "bg-ng-blue text-white",
  yellow: "bg-ng-yellow text-ng-ink",
  orange: "bg-ng-earth text-white",
  red: "bg-ng-coral text-white",
  coral: "bg-ng-coral text-white",
  purple: "bg-ng-purple text-white",
  white: "bg-white text-ng-ink border-2 border-b-[6px] border-ng-ink/15",
};

export function Btn({
  children,
  onClick,
  variant = "green",
  full = true,
  size = "md",
  disabled,
  sound = "tap",
  type = "button",
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  full?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  sound?: Tone | "none";
  type?: "button" | "submit";
  className?: string;
  ariaLabel?: string;
}) {
  const sizes = {
    sm: "px-4 py-2 text-base min-h-[48px]",
    md: "px-6 py-3 text-lg",
    lg: "px-7 py-4 text-xl min-h-[64px]",
  } as const;
  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={() => {
        if (disabled) return;
        if (sound !== "none") playTone(sound);
        onClick?.();
      }}
      className={`btn-ng ${VARIANTS[variant]} ${sizes[size]} ${full ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------------------------- Barre de progrès ---------------------------- */

export function ProgressBar({
  value,
  max = 100,
  color = "bg-ng-green",
  height = "h-4",
  label,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, max === 0 ? 0 : (value / max) * 100));
  return (
    <div
      className={`w-full ${height} overflow-hidden rounded-full bg-ng-ink/10`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "progression"}
    >
      <div
        className={`h-full ${color} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* -------------------------------- Mascottes ------------------------------- */

export function Mascot({
  id,
  size = 140,
  float = true,
  humeur = "calme",
  className = "",
}: {
  id: MascotId;
  /** Hauteur affichée en pixels. */
  size?: number;
  float?: boolean;
  /** Animation selon le moment : joie (réussite), indice (aide). */
  humeur?: "calme" | "joie" | "indice";
  className?: string;
}) {
  const m = MASCOTS[id];
  const largeur = Math.round((size * m.largeur) / m.hauteur);
  const anim =
    humeur === "joie" ? "anim-bounce" : humeur === "indice" ? "anim-wiggle" : float ? "anim-float" : "";
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: largeur, height: size }}>
      <div
        className="absolute inset-x-[10%] bottom-0 h-[10%] rounded-[50%] bg-ng-ink/10 blur-[2px]"
        aria-hidden
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- image locale optimisée, mise en cache hors ligne */}
      <img
        key={humeur}
        src={m.image}
        alt={m.nom}
        width={largeur}
        height={size}
        className={`relative h-full w-full object-contain drop-shadow-[0_6px_8px_rgba(45,42,38,0.18)] ${anim}`}
        draggable={false}
      />
    </div>
  );
}

/** Bulle de dialogue d'un personnage, avec bouton « écouter ». */
export function SpeechBubble({
  children,
  texteVoix,
  color = "#E0762E",
  size = "md",
  qui,
}: {
  children: ReactNode;
  /** Texte lu par la voix quand on touche le haut-parleur. */
  texteVoix?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  qui?: string;
}) {
  const sizes = { sm: "text-base p-3", md: "text-lg p-4", lg: "text-xl p-5" } as const;
  return (
    <div className="relative">
      <div
        className={`card-ng relative z-10 font-display leading-snug ${sizes[size]}`}
        style={{ borderColor: `${color}55` }}
      >
        {qui ? (
          <p className="mb-1 text-sm uppercase tracking-wide" style={{ color }}>
            {qui}
          </p>
        ) : null}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">{children}</div>
          {texteVoix ? <ListenButton texte={texteVoix} /> : null}
        </div>
      </div>
      <div
        className="absolute -top-2 left-10 z-0 h-5 w-5 rotate-45 rounded-[4px] border-t-3 border-l-3 bg-white"
        style={{ borderColor: `${color}55`, borderTopWidth: 3, borderLeftWidth: 3 }}
        aria-hidden
      />
    </div>
  );
}

export function ListenButton({ texte, label = "Écouter" }: { texte: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => speak(texte)}
      className="tap-target flex shrink-0 flex-col items-center justify-center rounded-2xl bg-ng-water-soft px-2 text-ng-blue-dark"
      aria-label={`${label} : ${texte}`}
    >
      <IconSound size={26} />
      <span className="text-[11px] font-extrabold">{label}</span>
    </button>
  );
}

/** Lit un texte automatiquement à l'apparition (si la voix est activée). */
export function useDireAuMontage(texte: string | null) {
  const dernier = useRef<string | null>(null);
  useEffect(() => {
    if (!texte || dernier.current === texte) return;
    dernier.current = texte;
    const minuterie = window.setTimeout(() => speak(texte), 250);
    return () => window.clearTimeout(minuterie);
  }, [texte]);
}

/* ------------------------- Personnages secondaires ------------------------ */

export function CharacterMedallion({ id, size = 64 }: { id: string; size?: number }) {
  const c = SECONDARY_CHARACTERS[id];
  if (!c) return null;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border-4 border-white shadow-[0_4px_0_rgba(45,42,38,0.12)]"
      style={{ width: size, height: size, background: `${c.couleur}33` }}
      role="img"
      aria-label={`${c.nom}, ${c.role}`}
    >
      <span style={{ fontSize: size * 0.55, lineHeight: 1 }}>{c.emoji}</span>
    </div>
  );
}

/* --------------------------------- Avatars -------------------------------- */

export const AVATARS: { id: AvatarId; nom: string; emoji?: string; couleur: string }[] = [
  { id: "kofi", nom: "Kofi", couleur: "#FCD9BD" },
  { id: "awa", nom: "Awa", couleur: "#E4D6F5" },
  { id: "elephant", nom: "Éléphant", emoji: "🐘", couleur: "#DCE6EE" },
  { id: "tortue", nom: "Tortue", emoji: "🐢", couleur: "#D8F0DC" },
  { id: "calao", nom: "Calao", emoji: "🦜", couleur: "#FFE9B8" },
  { id: "papillon", nom: "Papillon", emoji: "🦋", couleur: "#D9EEFB" },
];

export function Avatar({ id, size = 56 }: { id: AvatarId; size?: number }) {
  const a = AVATARS.find((x) => x.id === id) ?? AVATARS[0];
  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-white shadow-[0_3px_0_rgba(45,42,38,0.12)]"
      style={{ width: size, height: size, background: a.couleur }}
      aria-hidden
    >
      {a.emoji ? (
        <span style={{ fontSize: size * 0.58, lineHeight: 1 }}>{a.emoji}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- portrait recadré depuis l'illustration locale
        <img
          src={MASCOTS[a.id as MascotId].image}
          alt=""
          className={`absolute left-1/2 max-w-none -translate-x-1/2 ${
            a.id === "awa" ? "top-[-30%] w-[150%]" : "top-[4%] w-[150%]"
          }`}
          draggable={false}
        />
      )}
    </div>
  );
}

/* --------------------------------- Divers --------------------------------- */

export function Stars({ count, max = 3, size = 34 }: { count: number; max?: number; size?: number }) {
  return (
    <div className="flex justify-center gap-1" role="img" aria-label={`${count} étoile${count > 1 ? "s" : ""} sur ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < count ? "anim-pop" : ""} style={{ animationDelay: `${i * 0.18}s` }}>
          <IconStar size={size} filled={i < count} />
        </span>
      ))}
    </div>
  );
}

export function Chip({
  children,
  className = "bg-white text-ng-ink",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-display text-sm ${className}`}>
      {children}
    </span>
  );
}

/** En-tête simple : retour + titre. */
export function ScreenHeader({
  title,
  onBack,
  right,
  sticky = true,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  sticky?: boolean;
}) {
  return (
    <header className={`${sticky ? "sticky top-0 bg-ng-cream/95 backdrop-blur" : ""} z-20 flex items-center gap-3 px-4 py-3`}>
      {onBack ? (
        <button
          type="button"
          onClick={() => {
            playTone("tap");
            onBack();
          }}
          className="tap-target flex items-center justify-center rounded-2xl bg-white shadow-[0_3px_0_rgba(45,42,38,0.1)]"
          aria-label="Retour"
        >
          <IconBack size={30} />
        </button>
      ) : null}
      <h1 className="min-w-0 flex-1 truncate font-display text-2xl">{title}</h1>
      {right}
    </header>
  );
}

/** Fenêtre par-dessus l'écran (mobile : depuis le bas). */
export function Sheet({
  children,
  onClose,
  label,
}: {
  children: ReactNode;
  onClose?: () => void;
  label: string;
}) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={label}>
      <button
        type="button"
        className="absolute inset-0 bg-ng-ink/45"
        aria-label="Fermer"
        onClick={onClose}
        tabIndex={-1}
      />
      <div className="anim-rise relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-ng-cream p-5 pb-8 shadow-2xl sm:rounded-[2rem]">
        {children}
      </div>
    </div>
  );
}

/** Petite pluie de confettis pour les grandes réussites (désactivée si animations réduites). */
export function Confetti() {
  const couleurs = ["#F6B427", "#237A44", "#1A6FA8", "#C9432C", "#7A4BC0", "#E0762E"];
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          className="confetti absolute top-[-20px] block h-3 w-2 rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            background: couleurs[i % couleurs.length],
            animationDelay: `${(i % 7) * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}
