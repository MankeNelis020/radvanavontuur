import type { CSSProperties, TransitionEvent } from "react";
import type { SegmentId } from "@/lib/types";
import { segments } from "@/lib/types";

const segmentColor: Record<SegmentId, string> = {
  forest: "var(--segment-forest)",
  coast: "var(--segment-coast)",
  mountains: "var(--segment-mountains)",
  city: "var(--segment-city)",
  museum: "var(--segment-museum)",
  nearby: "var(--segment-nearby)",
};

function polar(cx: number, cy: number, radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function segmentPath(index: number, radius = 46) {
  const slice = 360 / segments.length;
  const center = -90 + index * slice;
  const start = polar(50, 50, radius, center - slice / 2);
  const end = polar(50, 50, radius, center + slice / 2);
  return `M 50 50 L ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y} Z`;
}

export function WheelGraphic({
  labels,
  rotation = 0,
  transition = "none",
  label,
  onSpinEnd,
}: {
  labels: Record<SegmentId, string>;
  rotation?: number;
  transition?: string;
  label: string;
  onSpinEnd?: (event: TransitionEvent<SVGSVGElement>) => void;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[28rem]">
      <svg viewBox="0 0 32 40" className="absolute left-1/2 top-0 z-10 h-10 w-8 -translate-x-1/2" aria-hidden="true">
        <path d="M16 38 L10.5 14 Q16 5 21.5 14 Z" fill="var(--brand-primary-dark)" />
        <circle cx="16" cy="12" r="3.1" fill="var(--brand-accent)" />
      </svg>
      <div className="px-2 pt-7">
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={label}
          className="wheel-disc w-full"
          style={{ transform: `rotate(${rotation}deg)`, transition } as CSSProperties}
          onTransitionEnd={onSpinEnd}
        >
          {segments.map((segment, index) => {
            const slice = 360 / segments.length;
            const center = -90 + index * slice;
            const point = polar(50, 50, 31, center);
            const text = labels[segment];
            return (
              <g key={segment}>
                <path
                  d={segmentPath(index)}
                  fill={segmentColor[segment]}
                  stroke="var(--brand-background)"
                  strokeWidth="0.8"
                >
                  <title>{text}</title>
                </path>
                <text
                  x={point.x}
                  y={point.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="var(--brand-background)"
                  fontSize={text.length > 8 ? 3.15 : 3.6}
                  fontWeight="700"
                  fontFamily="var(--font-nunito, Nunito Sans, sans-serif)"
                >
                  {text}
                </text>
              </g>
            );
          })}
          <circle cx="50" cy="50" r="15.5" fill="var(--brand-background)" />
          <circle cx="50" cy="50" r="12.2" fill="none" stroke="var(--brand-primary)" strokeWidth="0.6" />
          <path d="M50 40.5 L52.3 50 L50 48.2 L47.7 50 Z" fill="var(--brand-accent)" />
          <path d="M50 59.5 L47.7 50 L50 51.8 L52.3 50 Z" fill="var(--brand-sage)" />
          <circle cx="50" cy="50" r="1.35" fill="var(--brand-primary-dark)" />
        </svg>
        <div className="wheel-ground" />
      </div>
    </div>
  );
}
