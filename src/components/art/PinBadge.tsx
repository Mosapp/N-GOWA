import type { PinContent } from "@/content/types";

/**
 * Pin écologique, dessiné comme un petit insigne émaillé de mérite :
 * bord doré, émail coloré, emblème et ruban.
 */
export function PinBadge({
  pin,
  obtenu,
  size = 110,
}: {
  pin: PinContent;
  obtenu: boolean;
  size?: number;
}) {
  const id = `pin-${pin.id}`;
  const email = obtenu ? pin.couleur : "#D9D2C7";
  const fonce = obtenu ? pin.couleurFoncee : "#A79C8E";
  return (
    <svg width={size} height={size * 1.17} viewBox="0 0 120 140" aria-hidden>
      <defs>
        <linearGradient id={`${id}-or`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={obtenu ? "#FBE38E" : "#EEE8DF"} />
          <stop offset="0.5" stopColor={obtenu ? "#E2B13C" : "#CFC6B9"} />
          <stop offset="1" stopColor={obtenu ? "#A9781A" : "#A99E90"} />
        </linearGradient>
        <radialGradient id={`${id}-email`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ruban */}
      <path d="M36 92 L26 134 L42 126 L50 138 L58 100 Z" fill={fonce} />
      <path d="M84 92 L94 134 L78 126 L70 138 L62 100 Z" fill={fonce} />

      {/* médaillon */}
      <circle cx="60" cy="62" r="54" fill={`url(#${id}-or)`} />
      <circle cx="60" cy="62" r="46" fill={fonce} />
      <circle cx="60" cy="62" r="42" fill={email} />
      {/* petites perles du bord, façon broderie */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={60 + Math.cos(a) * 50}
            cy={62 + Math.sin(a) * 50}
            r="2.2"
            fill={obtenu ? "#FFF6D6" : "#F2EEE8"}
            opacity="0.85"
          />
        );
      })}
      <g transform="translate(60 62)" opacity={obtenu ? 1 : 0.55}>
        <Embleme embleme={pin.embleme} />
      </g>
      <circle cx="60" cy="62" r="42" fill={`url(#${id}-email)`} />

      {!obtenu ? (
        <g transform="translate(88 92)">
          <circle r="15" fill="#FFFFFF" stroke="#A79C8E" strokeWidth="3" />
          <rect x="-7" y="-2" width="14" height="10" rx="2.5" fill="#6B645C" />
          <path d="M-4.5 -2 v-3 a4.5 4.5 0 0 1 9 0 v3" fill="none" stroke="#6B645C" strokeWidth="2.6" />
        </g>
      ) : null}
    </svg>
  );
}

function Embleme({ embleme }: { embleme: PinContent["embleme"] }) {
  const trait = {
    stroke: "#FFFFFF",
    strokeWidth: 6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };
  switch (embleme) {
    case "tri": {
      // Trois flèches qui se suivent.
      const r = 21;
      const arcs = [0, 1, 2].map((i) => {
        const a0 = ((-90 + i * 120 + 14) * Math.PI) / 180;
        const a1 = ((-90 + i * 120 + 98) * Math.PI) / 180;
        const x0 = Math.cos(a0) * r;
        const y0 = Math.sin(a0) * r;
        const x1 = Math.cos(a1) * r;
        const y1 = Math.sin(a1) * r;
        // pointe de flèche orientée selon la tangente
        const t = a1 + Math.PI / 2;
        const p1x = x1 + Math.cos(t - 2.5) * 9;
        const p1y = y1 + Math.sin(t - 2.5) * 9;
        const p2x = x1 + Math.cos(t + 2.5) * 9;
        const p2y = y1 + Math.sin(t + 2.5) * 9;
        return (
          <g key={i}>
            <path d={`M${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`} {...trait} />
            <path d={`M${p1x.toFixed(1)} ${p1y.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)} L${p2x.toFixed(1)} ${p2y.toFixed(1)}`} {...trait} />
          </g>
        );
      });
      return <g>{arcs}</g>;
    }
    case "boucle":
      return (
        <g {...trait}>
          <path d="M-20 4 A 20 20 0 0 1 16 -12" />
          <path d="M20 -4 A 20 20 0 0 1 -16 12" />
          <path d="M6 -20 l11 8 -9 10" />
          <path d="M-6 20 l-11 -8 9 -10" />
        </g>
      );
    case "goutte":
      return (
        <g>
          <path d="M0 -24 C 10 -10, 18 -1, 18 8 A 18 18 0 0 1 -18 8 C -18 -1, -10 -10, 0 -24 Z" fill="#FFFFFF" />
          <path d="M-8 6 a 9 9 0 0 0 7 9" stroke="rgba(0,0,0,0.18)" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      );
    case "feuille":
      return (
        <g>
          <path d="M-18 18 C -20 -6, -4 -22, 20 -20 C 20 4, 4 20, -18 18 Z" fill="#FFFFFF" />
          <path d="M-18 18 L 10 -10 M-4 4 l-2 -9 M4 -4 l8 1" stroke="rgba(0,0,0,0.2)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </g>
      );
    case "eclair":
      return <path d="M4 -24 L-14 4 H0 L-4 24 L14 -4 H0 Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="3" strokeLinejoin="round" />;
    case "etoile":
      return (
        <path
          d="M0 -24 L7 -8 L24 -7 L11 4 L15 21 L0 12 L-15 21 L-11 4 L-24 -7 L-7 -8 Z"
          fill="#F6B427"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      );
    case "coeur":
      return (
        <g>
          <path
            d="M0 20 C -24 6, -22 -14, -10 -16 C -4 -17, -1 -12, 0 -9 C 1 -12, 4 -17, 10 -16 C 22 -14, 24 6, 0 20 Z"
            fill="#FFFFFF"
          />
        </g>
      );
  }
}
