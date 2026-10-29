/**
 * Décors originaux de N'GOWA, dessinés en SVG (légers et nets sur tous
 * les écrans) : soleil, savane, cases du village, marché, rivière, forêt,
 * panneaux solaires.
 */

const C = {
  ciel: "#FFE3A3",
  creme: "#FFF6E6",
  soleil: "#F6B427",
  soleilFonce: "#E09A12",
  colline: "#CDE8B5",
  herbe: "#A9D88C",
  herbeFoncee: "#7FC06A",
  feuille: "#3FA266",
  feuilleFoncee: "#237A44",
  laterite: "#E9C995",
  sol: "#F3D9A8",
  mur: "#D98E55",
  murFonce: "#B4532A",
  chaume: "#C9A04B",
  chaumeFonce: "#9C7A2E",
  eau: "#4BB0E6",
  eauFoncee: "#1A6FA8",
  tronc: "#8A5A2B",
  encre: "#2D2A26",
};

export function Sun({ x, y, r, rayons = true }: { x: number; y: number; r: number; rayons?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {rayons ? (
        <g className="anim-spin-slow" style={{ transformOrigin: "0 0" }}>
          {Array.from({ length: 12 }, (_, i) => (
            <rect
              key={i}
              x={-4}
              y={-r - 18}
              width={8}
              height={14}
              rx={4}
              fill={C.soleil}
              opacity={0.7}
              transform={`rotate(${i * 30})`}
            />
          ))}
        </g>
      ) : null}
      <circle r={r} fill={C.soleil} />
      <circle r={r * 0.72} fill="#FFD25E" />
    </g>
  );
}

export function Hut({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="44" rx="34" ry="5" fill="rgba(45,42,38,0.12)" />
      <rect x="-26" y="4" width="52" height="40" rx="6" fill={C.mur} />
      <path d="M-26 20 h52" stroke={C.murFonce} strokeWidth="3" opacity="0.4" />
      <rect x="-8" y="20" width="16" height="24" rx="8" fill={C.encre} opacity="0.75" />
      <path d="M-36 10 Q 0 -44 36 10 Q 0 2 -36 10 Z" fill={C.chaume} />
      <path d="M-20 4 L 0 -26 M 0 -26 L 18 4 M -8 6 L 0 -26 M 8 6 L 0 -26" stroke={C.chaumeFonce} strokeWidth="2" opacity="0.6" />
    </g>
  );
}

export function Stall({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="46" rx="40" ry="5" fill="rgba(45,42,38,0.12)" />
      <rect x="-34" y="-6" width="5" height="52" rx="2" fill={C.tronc} />
      <rect x="29" y="-6" width="5" height="52" rx="2" fill={C.tronc} />
      {/* auvent rayé */}
      <path d="M-42 -6 L -34 -24 H 34 L 42 -6 Z" fill={C.soleil} />
      {[-30, -14, 2, 18].map((sx) => (
        <path key={sx} d={`M${sx} -24 h 8 l 3 18 h -8 z`} fill={C.murFonce} opacity="0.85" />
      ))}
      <path d="M-42 -6 q 7 8 14 0 q 7 8 14 0 q 7 8 14 0 q 7 8 14 0 q 7 8 14 0 q 7 8 14 0" fill={C.soleil} />
      {/* étal et fruits */}
      <rect x="-36" y="22" width="72" height="10" rx="4" fill={C.tronc} />
      <circle cx="-22" cy="16" r="7" fill="#F28C28" />
      <circle cx="-10" cy="17" r="6" fill="#E0B42E" />
      <circle cx="4" cy="16" r="7" fill={C.feuille} />
      <circle cx="18" cy="17" r="6" fill="#C9432C" />
    </g>
  );
}

export function MiniBins({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const bacs = ["#F6B427", "#1A6FA8", "#237A44", "#8A5A2B"];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {bacs.map((c, i) => (
        <g key={c} transform={`translate(${i * 20} 0)`}>
          <path d="M-7 -6 h14 l-2 20 h-10 z" fill={c} />
          <rect x="-8.5" y="-10" width="17" height="5" rx="2.5" fill={c} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
        </g>
      ))}
    </g>
  );
}

export function Tree({ x, y, s = 1, couleur = C.feuille }: { x: number; y: number; s?: number; couleur?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-4" y="0" width="8" height="26" rx="3" fill={C.tronc} />
      <circle cx="-12" cy="-6" r="16" fill={couleur} />
      <circle cx="12" cy="-8" r="15" fill={couleur} />
      <circle cx="0" cy="-20" r="18" fill={couleur} />
      <circle cx="-4" cy="-24" r="7" fill="#FFFFFF" opacity="0.12" />
    </g>
  );
}

export function Baobab({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-14 40 C -10 10, -18 -6, -8 -16 H 8 C 18 -6, 10 10, 14 40 Z" fill="#9C6B3F" />
      <path d="M-8 -16 L -26 -34 M 0 -16 L 0 -40 M 8 -16 L 26 -32" stroke="#9C6B3F" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="-28" cy="-40" rx="18" ry="10" fill={C.feuille} />
      <ellipse cx="0" cy="-48" rx="20" ry="11" fill={C.feuilleFoncee} />
      <ellipse cx="28" cy="-38" rx="17" ry="10" fill={C.feuille} />
    </g>
  );
}

export function SolarPanel({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-2" y="2" width="4" height="22" fill="#6B645C" />
      <path d="M-26 4 L -18 -18 H 26 L 18 4 Z" fill="#1F4E79" stroke="#0F2E4A" strokeWidth="2" />
      <path d="M-22 -7 H 22 M -9 -18 L -13 4 M 5 -18 L 1 4" stroke="#7FB8E6" strokeWidth="1.6" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Carte d'aventure : 4 zones reliées par un chemin de latérite        */
/* ------------------------------------------------------------------ */

export const MAP_VIEWBOX = { w: 400, h: 1000 };

/** Position des zones sur la carte (en unités du viewBox). */
export const MAP_POSITIONS: Record<string, { x: number; y: number }> = {
  "village-tri": { x: 200, y: 262 },
  "riviere-vivante": { x: 118, y: 452 },
  "foret-decouvertes": { x: 290, y: 650 },
  "royaume-energie": { x: 150, y: 872 },
};

export function MapScene({ brumeApresVillage = true }: { brumeApresVillage?: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${MAP_VIEWBOX.w} ${MAP_VIEWBOX.h}`}
      className="block h-auto w-full"
      aria-hidden
      preserveAspectRatio="xMidYMin slice"
    >
      <defs>
        <linearGradient id="map-ciel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.ciel} />
          <stop offset="1" stopColor={C.creme} />
        </linearGradient>
        <linearGradient id="map-sol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CFE9B4" />
          <stop offset="0.45" stopColor={C.herbe} />
          <stop offset="0.75" stopColor="#B8D98A" />
          <stop offset="1" stopColor="#EAD99C" />
        </linearGradient>
      </defs>

      <rect width="400" height="1000" fill="url(#map-sol)" />
      <rect width="400" height="200" fill="url(#map-ciel)" />
      <Sun x={334} y={62} r={30} />
      <path d="M0 150 Q 80 108 160 138 T 320 128 T 400 140 V 200 H 0 Z" fill={C.colline} />

      {/* ---------- Le Village du Tri ---------- */}
      <path d="M0 196 Q 200 160 400 196 V 340 Q 200 360 0 330 Z" fill={C.sol} />
      <Tree x={34} y={196} s={1.1} />
      <Hut x={70} y={214} s={0.95} />
      <Hut x={336} y={226} s={0.85} />
      <Stall x={268} y={236} s={0.8} />
      <MiniBins x={104} y={292} s={0.9} />
      <Tree x={376} y={300} s={0.8} couleur={C.feuilleFoncee} />

      {/* ---------- La Rivière Vivante ---------- */}
      <path
        d="M0 410 C 100 380, 160 470, 260 430 S 400 412, 400 412 V 478 C 330 498, 260 470, 180 510 S 40 470, 0 494 Z"
        fill={C.eau}
      />
      <path d="M30 440 q 12 -6 24 0 M 210 455 q 12 -6 24 0 M 320 440 q 12 -6 24 0 M 120 486 q 12 -6 24 0" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* pirogue */}
      <g transform="translate(300 452)">
        <path d="M-26 0 Q 0 14 26 0 Z" fill={C.tronc} />
        <rect x="-1" y="-22" width="3" height="22" fill={C.tronc} />
      </g>
      {/* pont de planches */}
      <g transform="translate(118 448) rotate(-12)">
        {[-24, -12, 0, 12, 24].map((px) => (
          <rect key={px} x={px - 5} y="-22" width="10" height="44" rx="3" fill="#B98A55" stroke="#8A5A2B" strokeWidth="2" />
        ))}
      </g>
      <Tree x={360} y={540} s={0.8} />
      <Tree x={36} y={560} s={0.7} couleur={C.feuilleFoncee} />

      {/* ---------- La Forêt des Découvertes ---------- */}
      <Tree x={70} y={640} s={1.2} couleur={C.feuilleFoncee} />
      <Tree x={130} y={700} s={0.9} />
      <Tree x={210} y={610} s={1} couleur={C.feuilleFoncee} />
      <Baobab x={350} y={690} s={0.95} />
      <Tree x={220} y={740} s={0.8} />

      {/* ---------- Le Royaume de l'Énergie ---------- */}
      <path d="M0 860 Q 120 800 260 840 T 400 830 V 1000 H 0 Z" fill="#EBD893" />
      <SolarPanel x={250} y={880} s={1} />
      <SolarPanel x={320} y={900} s={0.9} />
      <Hut x={60} y={930} s={0.8} />
      <Sun x={340} y={960} r={10} rayons={false} />

      {/* ---------- Chemin de latérite ---------- */}
      <path
        d="M200 300 C 200 350, 110 370, 118 452 S 300 560, 290 650 S 120 760, 150 872"
        stroke={C.laterite}
        strokeWidth="24"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M200 300 C 200 350, 110 370, 118 452 S 300 560, 290 650 S 120 760, 150 872"
        stroke="#FFFFFF"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="2 16"
        opacity="0.9"
      />

      {/* Brume légère sur les zones encore à venir */}
      {brumeApresVillage ? <rect y="345" width="400" height="655" fill={C.creme} opacity="0.32" /> : null}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Décor du Village du Tri (en-tête de zone)                           */
/* ------------------------------------------------------------------ */

export function VillageScene() {
  return (
    <svg viewBox="0 0 400 190" className="block h-auto w-full" aria-hidden>
      <defs>
        <linearGradient id="village-ciel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.ciel} />
          <stop offset="1" stopColor={C.creme} />
        </linearGradient>
      </defs>
      <rect width="400" height="190" fill="url(#village-ciel)" />
      <Sun x={60} y={46} r={24} />
      <path d="M0 110 Q 90 74 190 100 T 400 92 V 190 H 0 Z" fill={C.colline} />
      <path d="M0 132 Q 200 112 400 132 V 190 H 0 Z" fill={C.sol} />
      <Tree x={360} y={112} s={1} />
      <Hut x={94} y={118} s={1} />
      <Hut x={300} y={128} s={0.8} />
      <Stall x={196} y={128} s={0.95} />
      <MiniBins x={240} y={170} s={0.85} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Décor de l'écran d'accueil                                          */
/* ------------------------------------------------------------------ */

export function WelcomeScene() {
  return (
    <svg
      viewBox="0 0 400 560"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="accueil-ciel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD98A" />
          <stop offset="0.55" stopColor={C.ciel} />
          <stop offset="1" stopColor={C.creme} />
        </linearGradient>
      </defs>
      <rect width="400" height="560" fill="url(#accueil-ciel)" />
      <Sun x={200} y={170} r={70} />
      <path d="M0 380 Q 100 320 200 352 T 400 340 V 560 H 0 Z" fill={C.colline} />
      <Baobab x={58} y={360} s={1.25} />
      <Hut x={344} y={372} s={0.9} />
      <path d="M0 430 Q 200 392 400 430 V 560 H 0 Z" fill={C.herbe} />
      <path d="M0 486 Q 200 456 400 486 V 560 H 0 Z" fill={C.herbeFoncee} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Emblème N'GOWA (soleil + feuille)                                   */
/* ------------------------------------------------------------------ */

export function Emblem({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="18" fill={C.feuilleFoncee} />
      <circle cx="42" cy="22" r="11" fill={C.soleil} />
      <path d="M14 50 C 12 30, 26 18, 44 20 C 44 38, 32 50, 14 50 Z" fill="#FFFFFF" />
      <path d="M14 50 L 34 30" stroke={C.feuilleFoncee} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
