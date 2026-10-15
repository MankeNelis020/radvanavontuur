"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TransitionEvent } from "react";
import { WheelGraphic } from "@/components/wheel/WheelGraphic";
import { DestinationCard } from "@/components/ui/DestinationCard";
import { PreferenceControls } from "@/components/ui/PreferenceControls";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { Button } from "@/components/ui/Button";
import { buttonClass } from "@/components/ui/button-styles";
import { places } from "@/lib/catalog";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { fill } from "@/lib/format";
import { selectIndex } from "@/lib/selection";
import { readSpin, saveSpin } from "@/lib/session";
import { segments, type PreferenceId, type SegmentId, type SpinMode, type SpinRecord } from "@/lib/types";
import { rotationForSegment } from "@/lib/wheel";

const MAX_PARTICIPANTS = 6;

type Participant = { id: string; age: number };

export function SpinExperience({
  locale,
  mode,
  dict,
}: {
  locale: Locale;
  mode: SpinMode;
  dict: Dictionary;
}) {
  const [distanceKm, setDistanceKm] = useState(25);
  const [participants, setParticipants] = useState<Participant[]>([{ id: "traveler", age: 32 }]);
  const [selected, setSelected] = useState<PreferenceId[]>(["outdoors"]);
  const [rotation, setRotation] = useState(0);
  const [phase, setPhase] = useState<"ready" | "spinning" | "landed">("ready");
  const [result, setResult] = useState<SpinRecord | null>(null);
  const rotationRef = useRef(0);
  const pendingRef = useRef<SpinRecord | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = readSpin();
      if (!saved || saved.mode !== mode) return;
      setDistanceKm(saved.distanceKm);
      setParticipants(saved.ages.map((age, index) => ({ id: `traveler-${index}`, age })));
      setSelected(saved.preferences);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [mode]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  function finish(record: SpinRecord) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    pendingRef.current = null;
    saveSpin(record);
    setResult(record);
    setPhase("landed");
  }

  function spin() {
    if (phase === "spinning") return;
    const index = selectIndex(segments.length);
    const segment = segments[index] ?? segments[0];
    const nextRotation = rotationForSegment(index, rotationRef.current, segments.length, 5);
    rotationRef.current = nextRotation;
    finishedRef.current = false;
    const record: SpinRecord = {
      segment,
      mode,
      distanceKm,
      ages: mode === "quick" ? [participants[0]?.age ?? 32] : participants.map((person) => person.age),
      preferences: mode === "extended" ? selected : [],
    };
    pendingRef.current = record;
    setPhase("spinning");
    setResult(null);
    setRotation(nextRotation);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      finish(record);
      return;
    }
    timeoutRef.current = window.setTimeout(() => finish(record), 5200);
  }

  function onSpinEnd(event: TransitionEvent<SVGSVGElement>) {
    if (event.propertyName !== "transform" || !pendingRef.current) return;
    finish(pendingRef.current);
  }

  function togglePreference(id: PreferenceId) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  const title = mode === "quick" ? dict.spin.quickTitle : dict.spin.extendedTitle;
  const intro = mode === "quick" ? dict.spin.quickIntro : dict.spin.extendedIntro;
  const landedSegment: SegmentId | null = result?.segment ?? null;
  const status =
    phase === "spinning"
      ? dict.spin.spinning
      : landedSegment
        ? fill(dict.spin.landed, { segment: dict.segments[landedSegment] })
        : dict.spin.independence;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 md:py-14">
      <div className="max-w-2xl">
        <h1 className="font-heading text-4xl font-extrabold md:text-5xl">{title}</h1>
        <p className="mt-3 text-lg">{intro}</p>
        <p className="mt-3">
          <Link
            className="font-heading font-bold text-brand-primary underline decoration-brand-line underline-offset-4"
            href={mode === "quick" ? `/${locale}/spin/extended` : `/${locale}/spin`}
          >
            {mode === "quick" ? dict.spin.moreDetail : dict.spin.lessDetail}
          </Link>
        </p>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <fieldset
          disabled={phase === "spinning"}
          className="order-2 min-w-0 rounded-card bg-brand-surface p-5 md:p-6 lg:order-1"
        >
          <legend className="sr-only">{title}</legend>
          <div className="space-y-6">
            <RangeSlider
              id="distance"
              label={dict.spin.distance}
              min={2}
              max={80}
              value={distanceKm}
              valueTemplate={dict.spin.distanceValue}
              onChange={setDistanceKm}
            />
            {mode === "quick" ? (
              <RangeSlider
                id="age-traveler"
                label={dict.spin.age}
                min={0}
                max={99}
                value={participants[0]?.age ?? 32}
                valueTemplate={dict.spin.ageValue}
                onChange={(age) => setParticipants([{ id: "traveler", age }])}
              />
            ) : (
              <div className="space-y-5">
                <p className="font-heading text-base font-bold text-brand-primary-dark">{dict.spin.participants}</p>
                {participants.map((person, index) => (
                  <div key={person.id} className="space-y-2">
                    <RangeSlider
                      id={`age-${person.id}`}
                      label={fill(dict.spin.participant, { n: index + 1 })}
                      min={0}
                      max={99}
                      value={person.age}
                      valueTemplate={dict.spin.ageValue}
                      onChange={(age) =>
                        setParticipants((current) =>
                          current.map((item) => (item.id === person.id ? { ...item, age } : item)),
                        )
                      }
                    />
                    {participants.length > 1 && (
                      <Button
                        variant="secondary"
                        onClick={() => setParticipants((current) => current.filter((item) => item.id !== person.id))}
                      >
                        {dict.spin.remove}
                      </Button>
                    )}
                  </div>
                ))}
                {participants.length < MAX_PARTICIPANTS && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setParticipants((current) => [
                        ...current,
                        { id: `traveler-${current.length}-${Date.now()}`, age: 30 },
                      ])
                    }
                  >
                    {dict.spin.addParticipant}
                  </Button>
                )}
                <PreferenceControls dict={dict} selected={selected} onToggle={togglePreference} />
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              {phase === "landed" && result ? (
                <>
                  <Link className={buttonClass("adventure", "w-full sm:w-auto")} href={`/${locale}/results`}>
                    {dict.results.title}
                  </Link>
                  <Button variant="secondary" className="w-full sm:w-auto" onClick={spin}>
                    {dict.results.respin}
                  </Button>
                </>
              ) : (
                <Button variant="adventure" className="w-full sm:w-auto" onClick={spin} disabled={phase === "spinning"}>
                  {dict.spin.spin}
                </Button>
              )}
            </div>
          </div>
        </fieldset>

        <div className="order-1 min-w-0 lg:order-2">
          <WheelGraphic
            labels={dict.segments}
            label={dict.wheelLabel}
            rotation={rotation}
            transition="transform var(--duration-spin) var(--ease-adventure)"
            onSpinEnd={onSpinEnd}
          />
          <p className="mt-4 text-center font-heading text-lg font-bold text-brand-primary-dark" aria-live="polite">
            {status}
          </p>
          {result && (
            <div className="mx-auto mt-6 max-w-xl">
              <DestinationCard
                dict={dict}
                segment={result.segment}
                title={dict.adventures[result.segment].title}
                summary={dict.adventures[result.segment].summary}
                mapsQuery={places[result.segment].mapsQuery}
              />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
