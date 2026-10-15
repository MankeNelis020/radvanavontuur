"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { rotationForWinner, type WheelSegment } from "@/domain/engine/wheel";
import { Button } from "@/components/ui/Button";

const COLORS = [
  { fill: "#1e4636", text: "#fbf7f0" },
  { fill: "#c4653a", text: "#fff8f3" },
  { fill: "#e2b340", text: "#1c1915" },
  { fill: "#1f5c62", text: "#fbf7f0" },
  { fill: "#f3eadc", text: "#1c1915" },
  { fill: "#8c3e22", text: "#fbf7f0" },
  { fill: "#3d7a5c", text: "#fbf7f0" },
  { fill: "#d5e2c8", text: "#1c1915" },
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
        <div
          aria-hidden
          className="absolute top-1 left-1/2 z-10 h-0 w-0 -translate-x-1/2 border-x-[14px] border-t-[28px] border-x-transparent border-t-forest-950"
        />
        <motion.div
          className="h-full w-full"
          animate={{ rotate: spinning ? rotation : 0 }}
          transition={reduced || !spinning ? { duration: 0 } : { duration: 4.8, ease: [0.12, 0.62, 0.08, 1] }}
          onAnimationComplete={() => {
            if (spinning) onRevealed();
          }}
        >
          <svg viewBox="0 0 100 100" role="img" aria-label="Rad met de kanshebbers voor dit avontuur" className="h-full w-full drop-shadow-xl">
            <circle cx="50" cy="50" r="49" fill="#17352a" />
            {segments.map((segment, index) => {
              const color = COLORS[index % COLORS.length] ?? COLORS[0];
              const point = labelPoint(segment.startDegrees, segment.endDegrees);
              return (
                <g key={segment.id}>
                  <path d={segmentPath(segment.startDegrees, segment.endDegrees)} fill={color.fill} stroke="#fbf7f0" strokeWidth="0.4" />
                  <text
                    x={point.x}
                    y={point.y}
                    fill={color.text}
                    fontSize="3.1"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {segment.label.length > 16 ? `${segment.label.slice(0, 15)}…` : segment.label}
                  </text>
                </g>
              );
            })}
            <circle cx="50" cy="50" r="8" fill="#fbf7f0" />
            <circle cx="50" cy="50" r="4.5" fill="#c4653a" />
          </svg>
        </motion.div>
      </div>
      <p className="mt-4 text-center text-sm text-ink-soft">
        De vakgrootte volgt het selectiegewicht. De winnaar is al gekozen; het rad laat die uitslag zien.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button type="button" className="text-lg" onClick={spin} disabled={spinning}>
          Draai het rad
        </Button>
        <Button type="button" variant="quiet" aria-pressed={sound} onClick={() => setSound((value) => !value)}>
          {sound ? "Geluid aan" : "Geluid uit"}
        </Button>
      </div>
    </div>
  );
}
