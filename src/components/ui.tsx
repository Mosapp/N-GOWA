"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { playTone } from "@/lib/audio";

/* ------------------------------- Couleurs -------------------------------- */

type Variant =
  | "green"
  | "blue"
  | "yellow"
  | "orange"
  | "red"
  | "purple"
  | "white";

const VARIANTS: Record<Variant, { bg: string; border: string; text: string }> = {
  green: { bg: "bg-ng-green", border: "border-ng-green-dark", text: "text-white" },
  blue: { bg: "bg-ng-blue", border: "border-ng-blue-dark", text: "text-white" },
  yellow: { bg: "bg-ng-yellow", border: "border-ng-yellow-dark", text: "text-ng-ink" },
  orange: { bg: "bg-ng-orange", border: "border-ng-orange-dark", text: "text-white" },
  red: { bg: "bg-ng-red", border: "border-ng-red-dark", text: "text-white" },
  purple: { bg: "bg-ng-purple", border: "border-ng-purple-dark", text: "text-white" },
  white: { bg: "bg-white", border: "border-ng-ink/15", text: "text-ng-ink" },
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
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  full?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  sound?: "tap" | "pop" | "none";
  type?: "button" | "submit";
  className?: string;
}) {
  const v = VARIANTS[variant];
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3.5 text-base",
    lg: "px-8 py-4.5 text-xl",
  } as const;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        if (sound !== "none") playTone(sound);
        onClick?.();
      }}
      className={`btn3d ${v.bg} ${v.border} ${v.text} ${sizes[size]} ${
        full ? "w-full" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

/* ------------------------------ Barre de progrès -------------------------- */

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
    <div className="relative w-full">
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
      {pct > 8 ? (
        <div
          className="pointer-events-none absolute top-0.5 left-1 h-1 rounded-full bg-white/60 transition-all duration-500"
          style={{ width: `${Math.max(0, pct - 6)}%` }}
        />
      ) : null}
    </div>
  );
}

/* --------------------------------- Mascottes ------------------------------ */

export type MascotId = "kofi" | "awa" | "coco" | "nia";

export const MASCOTS: Record<
  MascotId,
  { nom: string; role: string; image: string; couleur: string }
> = {
  kofi: {
    nom: "Kofi",
    role: "Ton guide d'aventure",
    image: "/mascots/kofi.png",
    couleur: "#FF9600",
  },
  awa: {
    nom: "Awa",
    role: "Raconteuse et exploratrice",
    image: "/mascots/awa.png",
    couleur: "#1CB0F6",
  },
  coco: {
    nom: "Coco",
    role: "Compagnon de jeu",
    image: "/mascots/coco.png",
    couleur: "#58CC02",
  },
  nia: {
    nom: "Nia",
    role: "Bientôt dans N'GOWA",
    image: "/mascots/coco.png",
    couleur: "#B45CE2",
  },
};

export function Mascot({
  id,
  size = 110,
  float = true,
  className = "",
}: {
  id: MascotId;
  size?: number;
  float?: boolean;
  className?: string;
}) {
  const mascot = MASCOTS[id];
  return (
    <div
      className={`relative ${float ? "anim-float" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full opacity-25 blur-xl"
        style={{ background: mascot.couleur }}
        aria-hidden
      />
      <Image
        src={mascot.image}
        alt={mascot.nom}
        width={size}
        height={size}
        className="relative h-full w-full object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)]"
        priority={size > 120}
      />
    </div>
  );
}

export function SpeechBubble({
  children,
  color = "#FF9600",
  size = "md",
}: {
  children: ReactNode;
  color?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-sm p-3",
    md: "text-base p-4",
    lg: "text-lg p-5",
  } as const;
  return (
    <div className="relative">
      <div
        className={`card-soft relative z-10 font-display leading-snug ${sizes[size]}`}
        style={{ borderColor: `${color}44` }}
      >
        {children}
      </div>
      <div
        className="absolute -bottom-2 left-10 z-0 h-5 w-5 rotate-45 rounded-[4px] border-r-3 border-b-3 bg-white"
        style={{ borderColor: `${color}44` }}
        aria-hidden
      />
    </div>
  );
}

/* --------------------------------- Divers --------------------------------- */

export function Chip({
  children,
  color = "bg-ng-yellow",
  text = "text-ng-ink",
  className = "",
}: {
  children: ReactNode;
  color?: string;
  text?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-display text-xs tracking-wide uppercase ${color} ${text} ${className}`}
    >
      {children}
    </span>
  );
}

export function Stars({ score }: { score: number }) {
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 40 ? 1 : 0;
  return (
    <div className="flex justify-center gap-2 text-3xl">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={i < stars ? "anim-pop" : "opacity-25"}
          style={{ animationDelay: `${i * 0.15}s` }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  emoji,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
}) {
  return (
    <div className="mb-4 text-center">
      <h2 className="font-display text-2xl text-ng-ink">
        {emoji ? <span className="mr-2">{emoji}</span> : null}
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm font-semibold text-ng-ink/60">{subtitle}</p>
      ) : null}
    </div>
  );
}
