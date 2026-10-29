/** Emblème N'GOWA (soleil + feuille), utilisé dans le logo. */
export function Emblem({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="18" fill="#237A44" />
      <circle cx="42" cy="22" r="11" fill="#F6B427" />
      <path d="M14 50 C 12 30, 26 18, 44 20 C 44 38, 32 50, 14 50 Z" fill="#FFFFFF" />
      <path d="M14 50 L 34 30" stroke="#237A44" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
