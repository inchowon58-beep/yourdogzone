type Props = {
  className?: string;
};

/** 황금 월계수 공식 인증 배지 */
export function GoldCertificationBadge({ className = "h-16 w-16" }: Props) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="goldMedal" x1="16" y1="12" x2="64" y2="68">
          <stop offset="0%" stopColor="#f5e6a8" />
          <stop offset="45%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
        <linearGradient id="goldRing" x1="20" y1="20" x2="60" y2="60">
          <stop offset="0%" stopColor="#e8c96a" />
          <stop offset="100%" stopColor="#c9a227" />
        </linearGradient>
      </defs>

      <circle cx="40" cy="40" r="36" stroke="url(#goldRing)" strokeWidth="1.5" opacity="0.45" />
      <circle cx="40" cy="40" r="30" stroke="#d4af37" strokeWidth="1" opacity="0.35" />

      <path
        d="M40 8c-2 6-8 10-14 10 2 5 1 11-3 15 5 1 9 5 11 10 6-3 13-3 18 0 2-5 6-9 11-10-4-4-5-10-3-15-6 0-12-4-14-10 0 6-4 12-10 14 6 2 10 8 10 14s-4 12-10 14c6 2 10 8 10 14 0-6 4-12 10-14-6-2-10-8-10-14s4-12 10-14c-6-2-10-8-10-14z"
        fill="none"
        stroke="url(#goldMedal)"
        strokeWidth="1.25"
        strokeLinejoin="round"
        opacity="0.9"
      />

      <path
        d="M12 42c4-8 12-12 20-10M68 42c-4-8-12-12-20-10M40 68c-2-9 2-17 8-22M40 12c2 7-1 14-6 19"
        stroke="#d4af37"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />

      <circle cx="40" cy="40" r="17" fill="url(#goldMedal)" stroke="#b8860b" strokeWidth="1.25" />
      <circle cx="40" cy="40" r="13" fill="none" stroke="#fff8dc" strokeWidth="0.75" opacity="0.6" />

      <path
        d="M40 31.5 42.8 37.2h6.1l-4.9 3.6 1.9 5.9-5.9-4.2-5.9 4.2 1.9-5.9-4.9-3.6h6.1z"
        fill="#fff8e7"
        stroke="#b8860b"
        strokeWidth="0.5"
      />

      <path
        d="M40 52v6M34 58h12"
        stroke="#b8860b"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <circle cx="40" cy="61.5" r="2" fill="#b8860b" />
    </svg>
  );
}
