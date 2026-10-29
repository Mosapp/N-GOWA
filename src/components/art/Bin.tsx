import type { BacContent } from "@/content/types";

/** Bac de tri illustré : couleur + pictogramme (la couleur n'est jamais le seul repère). */
export function Bin({
  bac,
  ouvert = false,
  size = 92,
}: {
  bac: BacContent;
  ouvert?: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size * 1.1}
      viewBox="0 0 100 110"
      aria-hidden
      style={{ overflow: "visible" }}
    >
      {/* ombre */}
      <ellipse cx="50" cy="104" rx="34" ry="5" fill="rgba(45,42,38,0.14)" />
      {/* corps */}
      <path
        d="M17 34 H83 L76 96 Q75 102 69 102 H31 Q25 102 24 96 Z"
        fill={bac.couleur}
        stroke={bac.couleurFoncee}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* reflets / rainures */}
      <path d="M30 42 L33 92" stroke="rgba(255,255,255,0.28)" strokeWidth="5" strokeLinecap="round" />
      <path d="M70 42 L67 92" stroke="rgba(0,0,0,0.10)" strokeWidth="5" strokeLinecap="round" />
      {/* pictogramme */}
      <g transform="translate(50 68)">
        <circle r="19" fill="rgba(255,255,255,0.92)" />
        <Picto picto={bac.picto} couleur={bac.couleurFoncee} />
      </g>
      {/* couvercle (charnière à gauche) */}
      <g
        style={{
          transformOrigin: "14px 32px",
          transform: ouvert ? "rotate(-28deg)" : "rotate(0deg)",
          transition: "transform 160ms ease-out",
        }}
      >
        <rect x="11" y="24" width="78" height="12" rx="6" fill={bac.couleurFoncee} />
        <rect x="40" y="17" width="20" height="9" rx="4.5" fill="none" stroke={bac.couleurFoncee} strokeWidth="4" />
      </g>
    </svg>
  );
}

function Picto({ picto, couleur }: { picto: BacContent["picto"]; couleur: string }) {
  const trait = { stroke: couleur, strokeWidth: 3.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  switch (picto) {
    case "bouteille":
      return (
        <path
          d="M-3 -13 h6 v4 q5 3 5 8 v12 q0 3 -3 3 h-10 q-3 0 -3 -3 v-12 q0 -5 5 -8 z"
          {...trait}
          fill={couleur}
          fillOpacity={0.15}
        />
      );
    case "feuille-papier":
      return (
        <g {...trait}>
          <path d="M-9 -12 h12 l6 6 v18 h-18 z" fill={couleur} fillOpacity={0.12} />
          <path d="M3 -12 v6 h6 M-5 -1 h10 M-5 5 h10" />
        </g>
      );
    case "bocal":
      return (
        <g {...trait}>
          <rect x="-7" y="-13" width="14" height="5" rx="1.5" />
          <path d="M-9 -8 h18 v17 q0 4 -4 4 h-10 q-4 0 -4 -4 z" fill={couleur} fillOpacity={0.12} />
        </g>
      );
    case "epluchure":
      return (
        <g {...trait}>
          <path d="M-10 9 C -10 -4, 0 -12, 11 -11 C 11 0, 3 10, -10 9 Z" fill={couleur} fillOpacity={0.15} />
          <path d="M-10 9 L 5 -5" />
        </g>
      );
    case "main":
      return (
        <g {...trait}>
          <path
            d="M-7 12 q-4 -4 -5 -9 q0 -3 3 -2 l3 4 v-14 q0 -2.5 2.5 -2.5 t2.5 2.5 v8 v-10 q0 -2.5 2.5 -2.5 t2.5 2.5 v10 v-7 q0 -2.5 2.5 -2.5 t2.5 2.5 v12 q0 8 -7 9 z"
            fill={couleur}
            fillOpacity={0.15}
          />
        </g>
      );
    case "boucle":
      return (
        <g {...trait}>
          <path d="M-10 2 A 10 10 0 0 1 8 -6" />
          <path d="M10 -2 A 10 10 0 0 1 -8 6" />
          <path d="M3 -10 l6 4 -5 5" />
          <path d="M-3 10 l-6 -4 5 -5" />
        </g>
      );
    case "poubelle":
      return (
        <g {...trait}>
          <path d="M-10 -8 h20 M-4 -8 v-3 h8 v3" />
          <path d="M-8 -8 l2 19 h12 l2 -19" fill={couleur} fillOpacity={0.12} />
          <path d="M-2 -3 v10 M2 -3 v10" />
        </g>
      );
  }
}
