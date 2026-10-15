"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { DistanceField, LocationField } from "@/components/spin/LocationField";
import { ParticipantsField, type ParticipantDraft } from "@/components/spin/ParticipantsField";
import { Button } from "@/components/ui/Button";
import { formatAge } from "@/domain/age";
import type { Origin } from "@/domain/types";

const GROUPS = [
  ["family", "Gezin met kinderen"],
  ["couple", "Stel"],
  ["friends", "Vrienden"],
  ["individual", "Alleen"],
  ["mixed", "Gemengde groep"],
] as const;

const ACCESS = [
  ["wheelchair", "Rolstoeltoegankelijk"],
  ["buggy", "Toegankelijk met buggy"],
  ["stroller", "Toegankelijk met kinderwagen"],
  ["limitedWalking", "Beperkte loopafstanden"],
  ["stairsFree", "Vermijd trappen"],
] as const;

const INTERESTS = [
  ["nature", "Natuur"],
  ["animals", "Dieren"],
  ["culture", "Cultuur"],
  ["food", "Eten"],
  ["sports", "Sport"],
  ["water", "Water"],
] as const;

const LEVELS = ["Heel relaxed", "Relaxed", "Gemiddeld", "Actief", "Heel actief"];
const MOODS = ["Pure rust", "Vooral relaxed", "In balans", "Avontuurlijk", "Heel avontuurlijk"];
const SURPRISE = ["Vertrouwd", "Licht verrassend", "Verrassend", "Onverwacht", "Wildcard"];

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
  labels: string[];
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
            className={`min-h-16 rounded-2xl px-1 text-xs font-semibold ${value === index + 1 ? "bg-forest-800 text-cream-50" : "bg-cream-100"}`}
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
  const [step, setStep] = useState(0);
  const [participants, setParticipants] = useState<ParticipantDraft[]>([{ id: "een", ageMonths: 36 * 12 }]);
  const [group, setGroup] = useState<(typeof GROUPS)[number][0]>("family");
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
      setError("Kies een locatie voordat je draait.");
      setStep(0);
      setPending(false);
      return;
    }
    if (departure === "custom" && !customDeparture) {
      setError("Kies een vertrekmoment.");
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
      setError(body.summary ?? "Geen bestemming binnen deze grenzen.");
      setPending(false);
      return;
    }
    router.push(`/avontuur/${body.id}`);
  }

  const titles = ["Jullie groep", "Het soort avontuur", "Praktische grenzen", "Maak het af"];

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (step < 3) setStep(step + 1);
        else void submit();
      }}
    >
      <p className="text-sm font-semibold text-forest-800">
        Stap {step + 1} van 4 — {titles[step]}
      </p>
      <div className="h-2 rounded-full bg-cream-200">
        <div className="h-2 rounded-full bg-terracotta-500" style={{ width: `${((step + 1) / 4) * 100}%` }} />
      </div>
      {step === 0 ? (
        <div className="space-y-6">
          <ParticipantsField participants={participants} onChange={setParticipants} />
          <LocationField origin={origin} query={query} onQuery={setQuery} onOrigin={setOrigin} error={null} />
          <fieldset>
            <legend className="font-semibold">Samenstelling</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {GROUPS.map(([value, label]) => (
                <button key={value} type="button" aria-pressed={group === value} className={`rounded-full px-4 py-2 ${group === value ? "bg-forest-800 text-cream-50" : "bg-cream-100"}`} onClick={() => setGroup(value)}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="font-semibold">Toegankelijkheid als harde eis</legend>
            <p className="text-sm text-ink-soft">Alleen bevestigde informatie telt. Onbekend is niet hetzelfde als toegankelijk.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ACCESS.map(([value, label]) => (
                <button key={value} type="button" aria-pressed={access.includes(value)} className={`rounded-full px-4 py-2 ${access.includes(value) ? "bg-forest-800 text-cream-50" : "bg-cream-100"}`} onClick={() => toggle(access, value, setAccess)}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block font-semibold" htmlFor="behoeften">
            Specifieke behoeften, optioneel
            <textarea id="behoeften" value={needs} onChange={(event) => setNeeds(event.target.value)} maxLength={500} className="mt-2 w-full rounded-2xl border border-cream-200 p-3 font-normal" placeholder="Alleen voor jou bewaard. Dit stuurt de selectie niet automatisch." />
          </label>
          <label className="flex items-center gap-3 font-semibold">
            <input type="checkbox" checked={allFit} onChange={(event) => setAllFit(event.target.checked)} />
            Het uitje moet voor iedereen geschikt zijn
          </label>
        </div>
      ) : null}
      {step === 1 ? (
        <div className="space-y-5">
          <Scale label="Tempo" hint="Van bankhangen tot flink bewegen." value={activity} labels={LEVELS} onChange={setActivity} />
          <Scale label="Rust of avontuur" hint="Dit stuurt de smaak, niet de veiligheid." value={mood} labels={MOODS} onChange={setMood} />
          <Scale label="Verrassing" hint="Een wildcard blijft binnen je harde grenzen." value={surprise} labels={SURPRISE} onChange={setSurprise} />
          <fieldset>
            <legend className="font-semibold">Binnen of buiten</legend>
            <div className="mt-2 flex gap-2">
              {(["indoor", "outdoor", "both"] as const).map((value) => (
                <button key={value} type="button" className={`rounded-full px-4 py-2 ${environment === value ? "bg-forest-800 text-cream-50" : "bg-cream-100"}`} onClick={() => setEnvironment(value)}>
                  {value === "indoor" ? "Binnen" : value === "outdoor" ? "Buiten" : "Allebei"}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="font-semibold">Interesses</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERESTS.map(([value, label]) => (
                <button key={value} type="button" aria-pressed={interests.includes(value)} className={`rounded-full px-4 py-2 ${interests.includes(value) ? "bg-gold-400" : "bg-cream-100"}`} onClick={() => toggle(interests, value, setInterests)}>
                  {label}
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
            <legend className="font-semibold">Vervoer</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {([["car", "Auto"], ["bicycle", "Fiets"], ["walking", "Lopen"], ["public_transport", "Openbaar vervoer"]] as const).map(([value, label]) => (
                <button key={value} type="button" className={`rounded-full px-4 py-2 ${transport === value ? "bg-forest-800 text-cream-50" : "bg-cream-100"}`} onClick={() => setTransport(value)}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="font-semibold">Tijd</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {([["1-2", "1–2 uur"], ["half_day", "Halve dag"], ["full_day", "Hele dag"], ["custom", "Zelf"]] as const).map(([value, label]) => (
                <button key={value} type="button" className={`rounded-full px-4 py-2 ${time === value ? "bg-forest-800 text-cream-50" : "bg-cream-100"}`} onClick={() => setTime(value)}>
                  {label}
                </button>
              ))}
            </div>
            {time === "custom" ? (
              <label className="mt-3 block text-sm" htmlFor="minuten">
                Minuten
                <input id="minuten" type="number" min={30} max={720} value={customMinutes} onChange={(event) => setCustomMinutes(Number(event.target.value))} className="mt-1 w-full rounded-2xl border border-cream-200 p-3" />
              </label>
            ) : null}
          </fieldset>
          <fieldset>
            <legend className="font-semibold">Vertrek</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {([["asap", "Zo snel mogelijk"], ["later_today", "Later vandaag"], ["tomorrow", "Morgen"], ["custom", "Zelf"]] as const).map(([value, label]) => (
                <button key={value} type="button" className={`rounded-full px-4 py-2 ${departure === value ? "bg-forest-800 text-cream-50" : "bg-cream-100"}`} onClick={() => setDeparture(value)}>
                  {label}
                </button>
              ))}
            </div>
            {departure === "custom" ? (
              <input type="datetime-local" value={customDeparture} onChange={(event) => setCustomDeparture(event.target.value)} className="mt-3 w-full rounded-2xl border border-cream-200 p-3" aria-label="Eigen datum en tijd" />
            ) : null}
          </fieldset>
          <fieldset>
            <legend className="font-semibold">Budget voor het hele gezelschap</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {([["none", "Geen maximum"], ["25", "Tot € 25"], ["50", "Tot € 50"], ["100", "Tot € 100"], ["custom", "Zelf"]] as const).map(([value, label]) => (
                <button key={value} type="button" className={`rounded-full px-4 py-2 ${budget === value ? "bg-forest-800 text-cream-50" : "bg-cream-100"}`} onClick={() => setBudget(value)}>
                  {label}
                </button>
              ))}
            </div>
            {budget === "custom" ? (
              <input type="number" min={0} value={customBudget} onChange={(event) => setCustomBudget(Number(event.target.value))} className="mt-3 w-full rounded-2xl border border-cream-200 p-3" aria-label="Eigen budget in euro" />
            ) : null}
          </fieldset>
          <fieldset>
            <legend className="font-semibold">Mag het avontuur entree kosten?</legend>
            <div className="mt-2 space-y-2">
              {([
                ["free_only", "Nee, uitsluitend gratis activiteiten"],
                ["prefer_free", "Liefst gratis, maar betaald mag"],
                ["paid_ok", "Ja, betaalde activiteiten zijn prima"],
              ] as const).map(([value, label]) => (
                <label key={value} className="flex gap-3 rounded-2xl bg-cream-100 p-3">
                  <input type="radio" name="entree" checked={entrance === value} onChange={() => setEntrance(value)} />
                  {label}
                </label>
              ))}
            </div>
            {entrance === "paid_ok" ? (
              <label className="mt-3 block text-sm" htmlFor="entreelimiet">
                Maximum entree voor het hele gezelschap, optioneel
                <input id="entreelimiet" inputMode="decimal" value={entranceLimit} onChange={(event) => setEntranceLimit(event.target.value)} className="mt-1 w-full rounded-2xl border border-cream-200 p-3" placeholder="Bijvoorbeeld 40" />
              </label>
            ) : null}
          </fieldset>
          <fieldset>
            <legend className="font-semibold">Weer</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {([["any", "Maakt niet uit"], ["avoid_rain", "Liever droog"], ["prefer_sun", "Liever zon"]] as const).map(([value, label]) => (
                <button key={value} type="button" className={`rounded-full px-4 py-2 ${weather === value ? "bg-forest-800 text-cream-50" : "bg-cream-100"}`} onClick={() => setWeather(value)}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}
      {step === 3 ? (
        <div className="space-y-4">
          <fieldset>
            <legend className="font-semibold">Wat hoort erbij?</legend>
            <div className="mt-2 space-y-2">
              {([
                ["activity_only", "Alleen het avontuur"],
                ["with_lunch", "Avontuur, lunch mag erbij"],
                ["with_lunch_and_stop", "Avontuur, lunch en een stop op de terugweg"],
              ] as const).map(([value, label]) => (
                <label key={value} className="flex gap-3 rounded-2xl bg-cream-100 p-3">
                  <input type="radio" name="afronding" checked={completion === value} onChange={() => setCompletion(value)} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex gap-3 font-semibold">
            <input type="checkbox" checked={avoidVisited} onChange={(event) => setAvoidVisited(event.target.checked)} />
            Sla eerder bezochte plekken over
          </label>
          <p className="text-sm text-ink-soft">Dat werkt voor avonturen die aan een account hangen. Zonder account onthouden we ze niet als bezocht.</p>
          <div className="rounded-3xl bg-white p-4 text-sm">
            <p className="font-display text-2xl">Klaar om te draaien</p>
            <ul className="mt-2 space-y-1">
              <li>{participants.length} deelnemers: {participants.map((person) => formatAge(person.ageMonths)).join(", ")}</li>
              <li>Straal {distance} km{origin ? ` vanaf ${origin.label}` : query ? ` vanaf ${query}` : ""}</li>
              <li>Tempo {activity}/5, verrassing {surprise}/5</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {titles.slice(0, 3).map((title, index) => (
                <button key={title} type="button" className="text-sm font-semibold text-forest-800 underline" onClick={() => setStep(index)}>
                  Wijzig {title.toLowerCase()}
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
            Terug
          </Button>
        ) : null}
        <Button type="submit" className="flex-1" disabled={pending}>
          {step < 3 ? "Volgende" : pending ? "Bestemmingen controleren…" : "Naar het rad"}
        </Button>
      </div>
      <AdSlot placement="below-form" />
    </form>
  );
}
