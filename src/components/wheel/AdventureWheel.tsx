"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { rotationForWinner, type WheelSegment } from "@/domain/engine/wheel";
import { Button } from "@/components/ui/Button";
import { useCopy } from "@/i18n/context";

const COLORS = [
  { fill: "var(--wheel-1)", text: "var(--wheel-1-text)" },
  { fill: "var(--wheel-2)", text: "var(--wheel-2-text)" },
  { fill: "var(--wheel-3)", text: "var(--wheel-3-text)" },
  { fill: "var(--wheel-4)", text: "var(--wheel-4-text)" },
  { fill: "var(--wheel-5)", text: "var(--wheel-5-text)" },
  { fill: "var(--wheel-6)", text: "var(--wheel-6-text)" },
  { fill: "var(--wheel-7)", text: "var(--wheel-7-text)" },
  { fill: "var(--wheel-8)", text: "var(--wheel-8-text)" },
];

function segmentPath(start: number, end: number): string {
  const point = (degrees: number) => {
    const radians = ((degrees - 90) * Math.PI) / 180;
    return [50 + 46 * Math.cos(radians), 50 + 46 * Math.sin(radians)];
  };
  const [x1, y1] = point(start);
  const [x2, y2] = point(Math.min(end, start + 359.99));
  const large = end - start > 180 ? 1 : 0;
  return `M 50 50 L ${x1} ${y1} A 46 46 0 ${large} 1 ${x2} ${y2} Z`;
}

function labelPoint(start: number, end: number): { x: number; y: number } {
  const mid = (start + end) / 2;
  const radians = ((mid - 90) * Math.PI) / 180;
  return { x: 50 + 30 * Math.cos(radians), y: 50 + 30 * Math.sin(radians) };
}

function playTicks() {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0.03;
  master.connect(context.destination);
  for (let index = 0; index < 16; index += 1) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 380 + index * 18;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    const start = context.currentTime + index * 0.16;
    gain.gain.setValueAtTime(0.4, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);
    oscillator.connect(gain).connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.06);
  }
  window.setTimeout(() => void context.close(), 4000);
}

export function AdventureWheel({
  segments,
  winnerId,
  onRevealed,
}: {
  segments: WheelSegment[];
  winnerId: string;
  onRevealed: () => void;
}) {
  const { t } = useCopy();
  const reduced = useReducedMotion();
  const [spinning, setSpinning] = useState(false);
  const [sound, setSound] = useState(false);
  const rotation = rotationForWinner(segments, winnerId, reduced ? 0 : 6);

  function spin() {
    if (spinning) return;
    setSpinning(true);
    if (sound && !reduced) playTicks();
    if (reduced) onRevealed();
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative aspect-square">
        <div aria-hidden className="absolute top-1 left-1/2 z-10 h-0 w-0 -translate-x-1/2 border-x-[14px] border-t-[28px] border-x-transparent border-t-forest-950" />
        <motion.div
          className="wheel-disc h-full w-full"
          animate={{ rotate: spinning ? rotation : 0 }}
          transition={reduced || !spinning ? { duration: 0 } : { duration: 4.8, ease: [0.12, 0.72, 0.08, 1] }}
          onAnimationComplete={() => {
            if (spinning) onRevealed();
          }}
        >
          <svg viewBox="0 0 100 100" role="img" aria-label={t.wheel.label} className="h-full w-full">
            <circle cx="50" cy="50" r="49" fill="var(--brand-primary-dark)" />
            {segments.map((segment, index) => {
              const color = COLORS[index % COLORS.length] ?? COLORS[0];
              const point = labelPoint(segment.startDegrees, segment.endDegrees);
              return (
                <g key={segment.id}>
                  <path d={segmentPath(segment.startDegrees, segment.endDegrees)} fill={color.fill} stroke="var(--brand-background)" strokeWidth="0.45" />
                  <text x={point.x} y={point.y} fill={color.text} fontSize="3.1" textAnchor="middle" dominantBaseline="middle">
                    {segment.label.length > 16 ? `${segment.label.slice(0, 15)}…` : segment.label}
                  </text>
                </g>
              );
            })}
            <circle cx="50" cy="50" r="8" fill="var(--brand-background)" />
            <circle cx="50" cy="50" r="3.2" fill="var(--brand-accent)" />
          </svg>
        </motion.div>
      </div>
      <p className="mt-4 text-center text-sm text-ink-soft">{t.wheel.caption}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button type="button" className="text-lg" onClick={spin} disabled={spinning}>
          {t.spinWheel}
        </Button>
        <Button type="button" variant="quiet" aria-pressed={sound} onClick={() => setSound((value) => !value)}>
          {sound ? t.wheel.soundOn : t.wheel.soundOff}
        </Button>
      </div>
    </div>
  );
}
