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
  if (bac.forme === "panneau") return <Panneau bac={bac} ouvert={ouvert} size={size} />;
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

/** Panneau en bois peint (pour classer des gestes plutôt que des objets). */
function Panneau({ bac, ouvert, size }: { bac: BacContent; ouvert: boolean; size: number }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 100 110" aria-hidden style={{ overflow: "visible" }}>
      <ellipse cx="50" cy="104" rx="26" ry="4.5" fill="rgba(45,42,38,0.14)" />
      <rect x="45" y="60" width="10" height="44" rx="3" fill="#9C6B3F" />
      <g
        style={{
          transformOrigin: "50px 60px",
          transform: ouvert ? "scale(1.08) rotate(-3deg)" : "none",
          transition: "transform 160ms ease-out",
        }}
      >
        <rect x="8" y="10" width="84" height="62" rx="18" fill={bac.couleur} stroke={bac.couleurFoncee} strokeWidth="3.5" />
        <rect x="14" y="15" width="72" height="10" rx="5" fill="rgba(255,255,255,0.22)" />
        <g transform="translate(50 43)">
          <circle r="21" fill="rgba(255,255,255,0.94)" />
          <Picto picto={bac.picto} couleur={bac.couleurFoncee} />
        </g>
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
    case "goutte":
      return (
        <path
          d="M0 -14 C 6 -6, 10 -1, 10 4 A 10 10 0 0 1 -10 4 C -10 -1, -6 -6, 0 -14 Z"
          {...trait}
          fill={couleur}
          fillOpacity={0.2}
        />
      );
    case "goutte-barree":
      return (
        <g {...trait}>
          <path d="M0 -14 C 6 -6, 10 -1, 10 4 A 10 10 0 0 1 -10 4 C -10 -1, -6 -6, 0 -14 Z" fill={couleur} fillOpacity={0.12} />
          <path d="M-12 -12 L 12 12" />
        </g>
      );
    case "poisson":
      return (
        <g {...trait}>
          <path d="M-11 0 C -5 -9, 6 -9, 10 0 C 6 9, -5 9, -11 0 Z" fill={couleur} fillOpacity={0.15} />
          <path d="M-11 0 L -15 -6 M -11 0 L -15 6" />
          <circle cx="5" cy="-2" r="1.2" fill={couleur} />
        </g>
      );
    case "nuage-sale":
      return (
        <g {...trait}>
          <path d="M-11 4 a 6 6 0 0 1 2 -11 a 8 8 0 0 1 15 1 a 5 5 0 0 1 4 10 z" fill={couleur} fillOpacity={0.3} />
          <path d="M-6 9 v4 M 0 9 v6 M 6 9 v4" />
        </g>
      );
    case "plante":
      return (
        <g {...trait}>
          <path d="M0 13 V -2" />
          <path d="M0 2 C -10 2, -12 -8, -10 -12 C -4 -12, 0 -6, 0 2 Z" fill={couleur} fillOpacity={0.2} />
          <path d="M0 -1 C 9 -1, 12 -9, 10 -13 C 4 -13, 0 -8, 0 -1 Z" fill={couleur} fillOpacity={0.2} />
        </g>
      );
    case "plante-barree":
      return (
        <g {...trait}>
          <path d="M0 13 V -2" />
          <path d="M0 2 C -10 2, -12 -8, -10 -12 C -4 -12, 0 -6, 0 2 Z" fill={couleur} fillOpacity={0.12} />
          <path d="M0 -1 C 9 -1, 12 -9, 10 -13 C 4 -13, 0 -8, 0 -1 Z" fill={couleur} fillOpacity={0.12} />
          <path d="M-13 -13 L 13 13" />
        </g>
      );
    case "arbre":
      return (
        <g {...trait}>
          <path d="M0 14 V 2" />
          <path d="M-11 2 a 8 8 0 0 1 2 -12 a 9 9 0 0 1 17 0 a 8 8 0 0 1 3 12 z" fill={couleur} fillOpacity={0.2} />
        </g>
      );
    case "herbe":
      return (
        <g {...trait}>
          <path d="M-13 12 H 13" />
          <path d="M-9 12 L -11 -2 M -4 12 L -4 -8 M 1 12 L 3 -12 M 6 12 L 10 -4 M 10 12 L 13 2" />
        </g>
      );
    case "vague":
      return (
        <g {...trait}>
          <path d="M-13 -5 q 4.3 -5 8.6 0 t 8.6 0 t 8.6 0" />
          <path d="M-13 3 q 4.3 -5 8.6 0 t 8.6 0 t 8.6 0" />
          <path d="M-13 11 q 4.3 -5 8.6 0 t 8.6 0 t 8.6 0" />
        </g>
      );
    case "fleur":
      return (
        <g {...trait}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-7" rx="4" ry="6" transform={`rotate(${a})`} fill={couleur} fillOpacity={0.18} />
          ))}
          <circle r="3.2" fill={couleur} />
        </g>
      );
    case "coeur":
      return (
        <path
          d="M0 12 C -15 2, -13 -11, -6 -11 C -2 -11, 0 -8, 0 -6 C 0 -8, 2 -11, 6 -11 C 13 -11, 15 2, 0 12 Z"
          {...trait}
          fill={couleur}
          fillOpacity={0.2}
        />
      );
    case "coeur-brise":
      return (
        <g {...trait}>
          <path
            d="M0 12 C -15 2, -13 -11, -6 -11 C -2 -11, 0 -8, 0 -6 C 0 -8, 2 -11, 6 -11 C 13 -11, 15 2, 0 12 Z"
            fill={couleur}
            fillOpacity={0.12}
          />
          <path d="M0 -6 L -3 0 L 2 3 L -1 10" />
        </g>
      );
    case "maison":
      return (
        <g {...trait}>
          <path d="M-12 0 L 0 -11 L 12 0" />
          <path d="M-8 -3 V 12 H 8 V -3" fill={couleur} fillOpacity={0.15} />
          <path d="M-2.5 12 V 5 H 2.5 V 12" />
        </g>
      );
    case "danger":
      return (
        <g {...trait}>
          <path d="M0 -13 L 13 11 H -13 Z" fill={couleur} fillOpacity={0.15} />
          <path d="M0 -4 V 3" />
          <circle cx="0" cy="7.5" r="0.6" />
        </g>
      );
    case "ampoule":
      return (
        <g {...trait}>
          <path d="M-5 6 C -5 1, -10 -2, -10 -6 A 10 10 0 0 1 10 -6 C 10 -2, 5 1, 5 6 Z" fill={couleur} fillOpacity={0.2} />
          <path d="M-4 10 H 4 M -3 13 H 3" />
        </g>
      );
    case "ampoule-barree":
      return (
        <g {...trait}>
          <path d="M-5 6 C -5 1, -10 -2, -10 -6 A 10 10 0 0 1 10 -6 C 10 -2, 5 1, 5 6 Z" fill={couleur} fillOpacity={0.12} />
          <path d="M-4 10 H 4 M -3 13 H 3" />
          <path d="M-13 -13 L 13 13" />
        </g>
      );
    case "soleil":
      return (
        <g {...trait}>
          <circle r="6" fill={couleur} fillOpacity={0.25} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <path key={a} d="M0 -10 V -13" transform={`rotate(${a})`} />
          ))}
        </g>
      );
    case "bidon":
      return (
        <g {...trait}>
          <path d="M-8 -6 L -3 -11 H 8 V 12 H -8 Z" fill={couleur} fillOpacity={0.15} />
          <path d="M2 -11 V -14 H 6 V -11 M -3 0 L 3 6 M 3 0 L -3 6" />
        </g>
      );
    case "coche":
      return (
        <g {...trait}>
          <circle r="12" fill={couleur} fillOpacity={0.12} />
          <path d="M-6 0 L -2 5 L 7 -5" />
        </g>
      );
    case "eclair":
      return (
        <g {...trait}>
          <path d="M0 -13 L 13 11 H -13 Z" fill={couleur} fillOpacity={0.12} />
          <path d="M1 -5 L -3 3 H 2 L -1 8" />
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
