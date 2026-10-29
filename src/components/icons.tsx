import type { SVGProps } from "react";

/** Icônes simples, à trait épais et arrondi, toujours accompagnées d'un mot. */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 28, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconMap = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z" />
    <path d="M9 4v13.5M15 6.5V20" />
  </Base>
);

export const IconMedal = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 3h8l-2.5 6h-3z" />
    <circle cx="12" cy="15" r="6" />
    <path d="m12 12 .9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" fill="currentColor" strokeWidth={1} />
  </Base>
);

export const IconSprout = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 21v-9" />
    <path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6Z" />
    <path d="M12 14c0-4 3-7 7-7 0 4-3 7-7 7Z" />
  </Base>
);

export const IconLock = (p: IconProps) => (
  <Base {...p}>
    <rect x="5" y="11" width="14" height="10" rx="3" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Base>
);

export const IconSound = ({ muted, ...p }: IconProps & { muted?: boolean }) => (
  <Base {...p}>
    <path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" />
    {muted ? (
      <path d="m16 9.5 5 5m0-5-5 5" />
    ) : (
      <>
        <path d="M15.5 9a4 4 0 0 1 0 6" />
        <path d="M18.5 6.5a8 8 0 0 1 0 11" />
      </>
    )}
  </Base>
);

export const IconBack = (p: IconProps) => (
  <Base {...p}>
    <path d="M15 5 8 12l7 7" />
  </Base>
);

export const IconClose = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
);

export const IconCheck = (p: IconProps) => (
  <Base {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Base>
);

export const IconGear = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
  </Base>
);

export const IconPrint = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 9V3h10v6" />
    <rect x="3" y="9" width="18" height="8" rx="2" />
    <path d="M7 14h10v7H7z" />
  </Base>
);

export const IconPlay = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 5.5v13l10-6.5z" fill="currentColor" />
  </Base>
);

export const IconSheet = (p: IconProps) => (
  <Base {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2.5" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Base>
);

export const IconStar = ({ filled = true, ...p }: IconProps & { filled?: boolean }) => (
  <svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" aria-hidden className={p.className}>
    <path
      d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.4l-5.8 3 1.1-6.4-4.7-4.6 6.5-.9z"
      fill={filled ? "#F6B427" : "#E8DFD2"}
      stroke={filled ? "#C98A0E" : "#D2C6B5"}
      strokeWidth={1.4}
      strokeLinejoin="round"
    />
  </svg>
);
