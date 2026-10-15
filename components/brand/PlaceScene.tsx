import type { SegmentId } from "@/lib/types";

export function PlaceScene({ segment }: { segment: SegmentId }) {
  return (
    <svg viewBox="0 0 320 200" className="block h-auto w-full" aria-hidden="true">
      {segment === "forest" && <Forest />}
      {segment === "coast" && <Coast />}
      {segment === "mountains" && <Mountains />}
      {segment === "city" && <City />}
      {segment === "museum" && <Museum />}
      {segment === "nearby" && <Nearby />}
    </svg>
  );
}

function Forest() {
  return (
    <>
      <rect width="320" height="200" fill="var(--brand-highlight)" />
      <circle cx="250" cy="42" r="16" fill="var(--brand-accent)" />
      <path fill="var(--brand-sage)" d="M0 118 L70 68 L120 98 L180 58 L250 108 L320 78 V200 H0 Z" />
      <path fill="var(--brand-primary)" d="M0 146 L80 98 L140 128 L210 88 L280 138 L320 116 V200 H0 Z" />
      <path fill="var(--brand-primary-dark)" d="M0 168 L60 138 L130 162 L200 128 L270 166 L320 148 V200 H0 Z" />
      <path
        d="M160 188 C150 160 190 148 170 118 C155 96 130 94 146 68"
        fill="none"
        stroke="var(--brand-background)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </>
  );
}

function Coast() {
  return (
    <>
      <rect width="320" height="200" fill="var(--brand-highlight)" />
      <circle cx="64" cy="56" r="18" fill="var(--brand-accent)" />
      <path fill="var(--segment-coast)" d="M0 108 H320 V200 H0 Z" />
      <path fill="var(--brand-primary)" d="M0 132 H320 V200 H0 Z" />
      <path fill="var(--brand-primary-dark)" d="M0 160 H320 V200 H0 Z" />
      <path fill="var(--brand-surface)" d="M0 118 C80 78 140 150 220 104 C260 84 290 96 320 88 V150 H0 Z" />
    </>
  );
}

function Mountains() {
  return (
    <>
      <rect width="320" height="200" fill="var(--brand-surface)" />
      <circle cx="246" cy="48" r="16" fill="var(--brand-accent)" />
      <path fill="var(--brand-sage)" d="M0 150 L70 70 L120 120 L170 60 L230 130 L280 90 L320 140 V200 H0 Z" />
      <path fill="var(--brand-primary-dark)" d="M0 168 L50 110 L100 156 L160 96 L220 160 L270 120 L320 168 V200 H0 Z" />
      <path
        d="M168 190 C160 168 188 160 176 140"
        fill="none"
        stroke="var(--brand-background)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </>
  );
}

function City() {
  return (
    <>
      <rect width="320" height="200" fill="var(--brand-highlight)" />
      <circle cx="250" cy="46" r="16" fill="var(--brand-accent)" />
      <path fill="var(--brand-surface)" d="M0 168 H320 V200 H0 Z" />
      <rect x="28" y="96" width="46" height="72" fill="var(--brand-primary)" />
      <rect x="84" y="72" width="54" height="96" fill="var(--brand-primary-dark)" />
      <rect x="148" y="108" width="40" height="60" fill="var(--segment-city)" />
      <rect x="198" y="84" width="50" height="84" fill="var(--brand-primary)" />
      <rect x="258" y="118" width="36" height="50" fill="var(--segment-museum)" />
      <path d="M24 176 H296" stroke="var(--brand-background)" strokeWidth="4" strokeLinecap="round" />
    </>
  );
}

function Museum() {
  return (
    <>
      <rect width="320" height="200" fill="var(--brand-surface)" />
      <circle cx="250" cy="44" r="15" fill="var(--brand-accent)" />
      <path fill="var(--brand-sage)" d="M0 168 H320 V200 H0 Z" />
      <path fill="var(--brand-primary)" d="M70 92 H250 L160 58 Z" />
      <rect x="78" y="92" width="164" height="76" fill="var(--brand-primary-dark)" />
      <rect x="96" y="108" width="16" height="60" fill="var(--brand-background)" />
      <rect x="128" y="108" width="16" height="60" fill="var(--brand-background)" />
      <rect x="160" y="108" width="16" height="60" fill="var(--brand-background)" />
      <rect x="192" y="108" width="16" height="60" fill="var(--brand-background)" />
    </>
  );
}

function Nearby() {
  return (
    <>
      <rect width="320" height="200" fill="var(--brand-highlight)" />
      <circle cx="230" cy="48" r="16" fill="var(--brand-accent)" />
      <path fill="var(--brand-sage)" d="M0 130 C80 90 120 150 200 112 C250 90 290 120 320 104 V200 H0 Z" />
      <path fill="var(--brand-primary)" d="M0 160 C90 130 150 180 230 150 C270 136 300 148 320 140 V200 H0 Z" />
      <path
        d="M40 176 C90 150 120 168 160 140 C190 120 230 128 280 96"
        fill="none"
        stroke="var(--brand-background)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </>
  );
}
