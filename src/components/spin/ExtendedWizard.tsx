"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { DistanceField, LocationField } from "@/components/spin/LocationField";
import { ParticipantsField, type ParticipantDraft } from "@/components/spin/ParticipantsField";
import { Button } from "@/components/ui/Button";
import { choiceClass, fieldClass } from "@/components/ui/choice";
import { formatAge } from "@/domain/age";
import type { Origin } from "@/domain/types";
import { useCopy } from "@/i18n/context";
import { fill } from "@/i18n/dictionary";

const GROUPS = ["family", "couple", "friends", "individual", "mixed"] as const;
const ACCESS = ["wheelchair", "buggy", "stroller", "limitedWalking", "stairsFree"] as const;
const INTERESTS = ["nature", "animals", "culture", "food", "sports", "water"] as const;

function Scale({
  label,
  hint,
  value,
  labels,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  labels: readonly string[];
  onChange: (value: number) => void;
}) {
  return (
    <fieldset>
      <legend className="font-semibold">{label}</legend>
      <p className="text-sm text-ink-soft">{hint}</p>
      <div className="mt-2 grid grid-cols-5 gap-1">
        {labels.map((item, index) => (
          <button
            key={item}
            type="button"
            aria-pressed={value === index + 1}
            className={`min-h-16 rounded-input px-1 text-xs font-semibold ${value === index + 1 ? "bg-forest-800 text-cream-50" : "bg-cream-100 text-ink"}`}
            onClick={() => onChange(index + 1)}
          >
            {index + 1}. {item}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function ExtendedWizard() {
  const router = useRouter();
  const { locale, t } = useCopy();
  const [step, setStep] = useState(0);
  const [participants, setParticipants] = useState<ParticipantDraft[]>([{ id: "een", ageMonths: 36 * 12 }]);
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("family");
  const [access, setAccess] = useState<string[]>([]);
  const [needs, setNeeds] = useState("");
  const [allFit, setAllFit] = useState(true);
  const [activity, setActivity] = useState(3);
  const [mood, setMood] = useState(3);
  const [environment, setEnvironment] = useState<"indoor" | "outdoor" | "both">("both");
  const [interests, setInterests] = useState<string[]>([]);
  const [surprise, setSurprise] = useState(3);
  const [transport, setTransport] = useState<"car" | "bicycle" | "walking" | "public_transport" | "">("");
  const [distance, setDistance] = useState(30);
  const [time, setTime] = useState<"1-2" | "half_day" | "full_day" | "custom">("half_day");
  const [customMinutes, setCustomMinutes] = useState(180);
  const [departure, setDeparture] = useState<"asap" | "later_today" | "tomorrow" | "custom">("asap");
  const [customDeparture, setCustomDeparture] = useState("");
  const [budget, setBudget] = useState<"none" | "25" | "50" | "100" | "custom">("none");
  const [customBudget, setCustomBudget] = useState(75);
  const [entrance, setEntrance] = useState<"free_only" | "prefer_free" | "paid_ok">("paid_ok");
  const [entranceLimit, setEntranceLimit] = useState("");
  const [weather, setWeather] = useState<"any" | "avoid_rain" | "prefer_sun">("any");
  const [completion, setCompletion] = useState<"activity_only" | "with_lunch" | "with_lunch_and_stop">("activity_only");
  const [avoidVisited, setAvoidVisited] = useState(false);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function submit() {
    setPending(true);
    setError(null);
    let resolved = origin;
    if (!resolved) {
      const response = await fetch("/api/locatie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (response.ok) resolved = (await response.json()) as Origin;
    }
    if (!resolved) {
      setError(t.extended.locationError);
      setStep(0);
      setPending(false);
      return;
    }
    if (departure === "custom" && !customDeparture) {
      setError(t.extended.departureError);
      setStep(2);
      setPending(false);
      return;
    }
    const budgetEur = budget === "none" ? null : budget === "custom" ? customBudget : Number(budget);
    const response = await fetch("/api/avonturen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "extended",
        participants,
        origin: resolved,
        maxDistanceKm: distance,
        groupComposition: group,
        accessibility: access,
        specificNeeds: needs,
        allParticipantsMustFit: allFit,
        activityLevel: activity,
        relaxationAdventure: mood,
        environment,
        interests,
        surpriseLevel: surprise,
        transportation: transport || null,
        availableTime: time === "custom" ? { kind: "custom", minutes: customMinutes } : { kind: time },
        departure:
          departure === "custom"
            ? { kind: "custom", iso: new Date(customDeparture).toISOString() }
            : { kind: departure },
        budgetEur,
        entranceFee: entrance,
        entranceLimitEur: entranceLimit ? Number(entranceLimit) : null,
        weatherPreference: weather,
        completion,
        avoidVisited,
      }),
    });
    const body = (await response.json()) as { id?: string; summary?: string };
    if (!response.ok || !body.id) {
      setError(body.summary ?? t.extended.none);
      setPending(false);
      return;
    }
    router.push(`/avontuur/${body.id}`);
  }

  const titles = t.extended.steps;
  const from = origin ? fill(t.extended.summaryFrom, { place: origin.label }) : query ? fill(t.extended.summaryFrom, { place: query }) : "";

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (step < 3) setStep(step + 1);
        else void submit();
      }}
    >
      <p className="text-sm font-semibold text-forest-800">{fill(t.extended.step, { current: step + 1, title: titles[step] ?? "" })}</p>
      <div className="h-2 rounded-full bg-cream-200">
        <div className="h-2 rounded-full bg-forest-800" style={{ width: `${((step + 1) / 4) * 100}%` }} />
      </div>
      {step === 0 ? (
        <div className="space-y-6">
          <ParticipantsField participants={participants} onChange={setParticipants} />
          <LocationField origin={origin} query={query} onQuery={setQuery} onOrigin={setOrigin} error={null} />
          <fieldset>
            <legend className="font-semibold">{t.extended.composition}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {GROUPS.map((value) => (
                <button key={value} type="button" aria-pressed={group === value} className={choiceClass(group === value)} onClick={() => setGroup(value)}>
                  {t.group[value]}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="font-semibold">{t.extended.access}</legend>
            <p className="text-sm text-ink-soft">{t.extended.accessHint}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ACCESS.map((value) => (
                <button key={value} type="button" aria-pressed={access.includes(value)} className={choiceClass(access.includes(value))} onClick={() => toggle(access, value, setAccess)}>
                  {t.access[value]}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block font-semibold" htmlFor="behoeften">
            {t.extended.needs}
            <textarea id="behoeften" value={needs} onChange={(event) => setNeeds(event.target.value)} maxLength={500} className={`${fieldClass} font-normal`} placeholder={t.extended.needsPlaceholder} />
          </label>
          <label className="flex items-center gap-3 font-semibold">
            <input type="checkbox" checked={allFit} onChange={(event) => setAllFit(event.target.checked)} />
            {t.extended.allFit}
          </label>
        </div>
      ) : null}
      {step === 1 ? (
        <div className="space-y-5">
          <Scale label={t.extended.pace} hint={t.extended.paceHint} value={activity} labels={t.levels} onChange={setActivity} />
          <Scale label={t.extended.mood} hint={t.extended.moodHint} value={mood} labels={t.moods} onChange={setMood} />
          <Scale label={t.extended.surprise} hint={t.extended.surpriseHint} value={surprise} labels={t.surprises} onChange={setSurprise} />
          <fieldset>
            <legend className="font-semibold">{t.extended.environment}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["indoor", "outdoor", "both"] as const).map((value) => (
                <button key={value} type="button" className={choiceClass(environment === value)} onClick={() => setEnvironment(value)}>
                  {value === "indoor" ? t.extended.indoor : value === "outdoor" ? t.extended.outdoor : t.extended.both}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="font-semibold">{t.extended.interests}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERESTS.map((value) => (
                <button key={value} type="button" aria-pressed={interests.includes(value)} className={choiceClass(interests.includes(value))} onClick={() => toggle(interests, value, setInterests)}>
                  {t.interest[value]}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}
      {step === 2 ? (
        <div className="space-y-5">
          <DistanceField value={distance} onChange={setDistance} />
          <fieldset>
            <legend className="font-semibold">{t.extended.transport}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["car", "bicycle", "walking", "public_transport"] as const).map((value) => (
                <button key={value} type="button" className={choiceClass(transport === value)} onClick={() => setTransport(value)}>
                  {t.transport[value]}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="font-semibold">{t.extended.time}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["1-2", "half_day", "full_day", "custom"] as const).map((value) => (
                <button key={value} type="button" className={choiceClass(time === value)} onClick={() => setTime(value)}>
                  {t.time[value]}
                </button>
              ))}
            </div>
            {time === "custom" ? (
              <label className="mt-3 block text-sm" htmlFor="minuten">
                {t.extended.minutes}
                <input id="minuten" type="number" min={30} max={720} value={customMinutes} onChange={(event) => setCustomMinutes(Number(event.target.value))} className={fieldClass} />
              </label>
            ) : null}
          </fieldset>
          <fieldset>
            <legend className="font-semibold">{t.extended.departure}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["asap", "later_today", "tomorrow", "custom"] as const).map((value) => (
                <button key={value} type="button" className={choiceClass(departure === value)} onClick={() => setDeparture(value)}>
                  {t.departure[value]}
                </button>
              ))}
            </div>
            {departure === "custom" ? (
              <input type="datetime-local" value={customDeparture} onChange={(event) => setCustomDeparture(event.target.value)} className={fieldClass} aria-label={t.extended.departureCustom} />
            ) : null}
          </fieldset>
          <fieldset>
            <legend className="font-semibold">{t.extended.budget}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["none", "25", "50", "100", "custom"] as const).map((value) => (
                <button key={value} type="button" className={choiceClass(budget === value)} onClick={() => setBudget(value)}>
                  {t.budget[value]}
                </button>
              ))}
            </div>
            {budget === "custom" ? (
              <input type="number" min={0} value={customBudget} onChange={(event) => setCustomBudget(Number(event.target.value))} className={fieldClass} aria-label={t.extended.budgetCustom} />
            ) : null}
          </fieldset>
          <fieldset>
            <legend className="font-semibold">{t.extended.entrance}</legend>
            <div className="mt-2 space-y-2">
              {(["free_only", "prefer_free", "paid_ok"] as const).map((value) => (
                <label key={value} className="flex gap-3 rounded-input bg-cream-100 p-3">
                  <input type="radio" name="entree" checked={entrance === value} onChange={() => setEntrance(value)} />
                  {t.entrance[value]}
                </label>
              ))}
            </div>
            {entrance === "paid_ok" ? (
              <label className="mt-3 block text-sm" htmlFor="entreelimiet">
                {t.extended.entranceLimit}
                <input id="entreelimiet" inputMode="decimal" value={entranceLimit} onChange={(event) => setEntranceLimit(event.target.value)} className={fieldClass} placeholder={t.extended.entrancePlaceholder} />
              </label>
            ) : null}
          </fieldset>
          <fieldset>
            <legend className="font-semibold">{t.extended.weather}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["any", "avoid_rain", "prefer_sun"] as const).map((value) => (
                <button key={value} type="button" className={choiceClass(weather === value)} onClick={() => setWeather(value)}>
                  {t.weather[value]}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}
      {step === 3 ? (
        <div className="space-y-4">
          <fieldset>
            <legend className="font-semibold">{t.extended.completion}</legend>
            <div className="mt-2 space-y-2">
              {(["activity_only", "with_lunch", "with_lunch_and_stop"] as const).map((value) => (
                <label key={value} className="flex gap-3 rounded-input bg-cream-100 p-3">
                  <input type="radio" name="afronding" checked={completion === value} onChange={() => setCompletion(value)} />
                  {t.completion[value]}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex gap-3 font-semibold">
            <input type="checkbox" checked={avoidVisited} onChange={(event) => setAvoidVisited(event.target.checked)} />
            {t.extended.avoidVisited}
          </label>
          <p className="text-sm text-ink-soft">{t.extended.avoidHint}</p>
          <div className="rounded-card bg-cream-100 p-4 text-sm">
            <p className="font-display text-2xl text-forest-950">{t.extended.ready}</p>
            <ul className="mt-2 space-y-1">
              <li>{fill(t.extended.summaryPeople, { count: participants.length, ages: participants.map((person) => formatAge(person.ageMonths, locale)).join(", ") })}</li>
              <li>{fill(t.extended.summaryDistance, { distance, from })}</li>
              <li>{fill(t.extended.summaryTaste, { activity, surprise })}</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {titles.slice(0, 3).map((title, index) => (
                <button key={title} type="button" className="text-sm font-semibold text-forest-800 underline" onClick={() => setStep(index)}>
                  {fill(t.extended.edit, { title: title.toLowerCase() })}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {error ? <p role="alert" className="font-semibold text-terracotta-700">{error}</p> : null}
      <div className="flex gap-2">
        {step > 0 ? (
          <Button type="button" variant="quiet" onClick={() => setStep(step - 1)}>
            {t.extended.back}
          </Button>
        ) : null}
        <Button type="submit" className="flex-1" disabled={pending}>
          {step < 3 ? t.extended.next : pending ? t.extended.pending : t.extended.submit}
        </Button>
      </div>
      <AdSlot placement="below-form" />
    </form>
  );
}
