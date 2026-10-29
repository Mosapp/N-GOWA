"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { IconBack, IconSound, IconStar } from "@/components/icons";
import { illustrationMascotte, MASCOTS, SECONDARY_CHARACTERS, type MascotId, type Pose } from "@/content/characters";
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
  pose,
  className = "",
}: {
  id: MascotId;
  /** Hauteur affichée en pixels. */
  size?: number;
  float?: boolean;
  /** Moment : joie (réussite), indice (aide). Choisit la pose et l'animation. */
  humeur?: "calme" | "joie" | "indice";
  /** Pose précise (sinon déduite de l'humeur). */
  pose?: Pose;
  className?: string;
}) {
  const poseChoisie: Pose | undefined =
    pose ?? (humeur === "joie" ? "bravo" : humeur === "indice" ? (id === "awa" ? "indice" : "reflechit") : undefined);
  const m = illustrationMascotte(id, poseChoisie);
  const largeur = Math.round((size * m.largeur) / m.hauteur);
  const anim =
    humeur === "joie" ? "anim-bounce" : humeur === "indice" ? "anim-wiggle" : float ? "anim-float" : "";
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: largeur, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- image locale optimisée, mise en cache hors ligne */}
      <img
        key={`${humeur}-${poseChoisie}`}
        src={m.image}
        alt={MASCOTS[id].nom}
        width={largeur}
        height={size}
        className={`relative h-full w-full object-contain ${anim}`}
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
      className="shrink-0 overflow-hidden rounded-full border-4 bg-white shadow-[0_4px_0_rgba(45,42,38,0.12)]"
      style={{ width: size, height: size, borderColor: `${c.couleur}` }}
      role="img"
      aria-label={`${c.nom}, ${c.role}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- portrait local, mis en cache hors ligne */}
      <img
        src={c.portrait}
        alt=""
        className="h-full w-full object-cover"
        style={{ objectPosition: c.cadrage ?? "50% 18%", transform: `scale(${c.zoom ?? 1.35})`, transformOrigin: c.cadrage ? "50% 0%" : "50% 50%" }}
        draggable={false}
      />
    </div>
  );
}

/* --------------------------------- Avatars -------------------------------- */

const portrait = (id: string) => `/illustrations/avatars/${id}.webp`;

export const AVATARS: { id: AvatarId; nom: string; image: string; couleur: string }[] = [
  { id: "kofi", nom: "Kofi", image: portrait("kofi"), couleur: "#FCD9BD" },
  { id: "awa", nom: "Awa", image: portrait("awa"), couleur: "#E4D6F5" },
  { id: "moussa", nom: "Moussa", image: portrait("moussa"), couleur: "#CDEBD9" },
  { id: "fatou", nom: "Fatou", image: portrait("fatou"), couleur: "#FBEFC4" },
  { id: "yann", nom: "Yann", image: portrait("yann"), couleur: "#D3E8F7" },
  { id: "aicha", nom: "Aïcha", image: portrait("aicha"), couleur: "#FBDCC8" },
  { id: "kouame", nom: "Kouamé", image: portrait("kouame"), couleur: "#F6C9B8" },
  { id: "ama", nom: "Ama", image: portrait("ama"), couleur: "#E4D9F7" },
  { id: "elephant", nom: "Éléphant", image: portrait("elephant"), couleur: "#DCE2E4" },
  { id: "tortue", nom: "Tortue", image: portrait("tortue"), couleur: "#E2EDC9" },
  { id: "calao", nom: "Calao", image: portrait("calao"), couleur: "#FBE7BE" },
  { id: "papillon", nom: "Papillon", image: portrait("papillon"), couleur: "#D3E5F2" },
  { id: "chimpanze", nom: "Chimpo", image: portrait("chimpanze"), couleur: "#F3DDC6" },
  { id: "hippo", nom: "Hippo", image: portrait("hippo"), couleur: "#F5D2D2" },
];

export function Avatar({ id, size = 56 }: { id: AvatarId; size?: number }) {
  const a = AVATARS.find((x) => x.id === id) ?? AVATARS[0];
  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-white shadow-[0_3px_0_rgba(45,42,38,0.12)]"
      style={{ width: size, height: size, background: a.couleur }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- portrait carré local, affiché en rond */}
      <img src={a.image} alt="" className="h-full w-full object-cover" draggable={false} />
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

/* ------------------------------ Illustrations ----------------------------- */

export const DECORS = {
  accueil: "/illustrations/decors/accueil.webp",
  pause: "/illustrations/decors/pause.webp",
  kofiRepos: "/illustrations/decors/kofi-repos.webp",
  awaAuRevoir: "/illustrations/decors/awa-au-revoir.webp",
  coffre: "/illustrations/decors/coffre.webp",
};

/** Image de décor qui remplit son parent (positionné en relatif). */
export function DecorFond({
  src,
  position = "50% 50%",
  voile = "from-ng-cream/0 to-ng-cream/0",
  priorite = false,
}: {
  src: string;
  position?: string;
  /** Dégradé Tailwind posé par-dessus pour la lisibilité du texte. */
  voile?: string;
  priorite?: boolean;
}) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- décor local optimisé, mis en cache hors ligne */}
      <img
        src={src}
        alt=""
        aria-hidden
        loading={priorite ? "eager" : "lazy"}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: position }}
        draggable={false}
      />
      <div className={`absolute inset-0 bg-gradient-to-r ${voile}`} aria-hidden />
    </>
  );
}

/** Image illustrée simple (vignette, scène), arrondie. */
export function Illustration({
  src,
  alt = "",
  className = "",
  ratio = "16 / 9",
}: {
  src: string;
  alt?: string;
  className?: string;
  ratio?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- illustration locale optimisée, mise en cache hors ligne
    <img
      src={src}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      loading="lazy"
      decoding="async"
      className={`w-full object-cover ${className}`}
      style={{ aspectRatio: ratio }}
      draggable={false}
    />
  );
}
