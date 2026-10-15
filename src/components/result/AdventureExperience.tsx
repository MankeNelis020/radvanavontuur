"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { RouteFromHere } from "@/components/result/RouteFromHere";
import { AdventureWheel } from "@/components/wheel/AdventureWheel";
import { Button } from "@/components/ui/Button";
import { REVIEW_TAGS } from "@/content/reviews";
import type { AdventureView } from "@/application/view";

const REASONS = [
  ["been_there", "Hier ben ik al geweest"],
  ["not_appealing", "Dit spreekt me niet aan"],
  ["not_practical", "Praktisch toch niet haalbaar"],
  ["want_different", "Ik wil iets heel anders"],
  ["other", "Anders"],
] as const;

async function post(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : "{}",
  });
  const payload = (await response.json().catch(() => ({}))) as { summary?: string; status?: string; mapsUrl?: string | null };
  return { ok: response.ok, ...payload };
}

function track(name: string, properties: Record<string, string | number | boolean | null>) {
  if (!document.cookie.includes("rva_consent=analytics")) return;
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, properties }),
  });
}

export function AdventureExperience({ view, signedIn }: { view: AdventureView; signedIn: boolean }) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(view.shared);
  const [statusOverride, setStatusOverride] = useState<AdventureView["status"] | null>(null);
  const [mapsOverride, setMapsOverride] = useState<string | null | undefined>(undefined);
  const [respinLocked, setRespinLocked] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number][0]>("not_appealing");
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const selection = view.selection;
  const status = statusOverride ?? view.status;
  const mapsUrl = mapsOverride === undefined ? view.mapsUrl : mapsOverride;
  const canRespin = !respinLocked && view.canRespin;

  if (!selection) {
    return <p>Dit avontuur heeft geen bestemming.</p>;
  }

  async function accept() {
    const result = await post(`/api/avonturen/${view.id}/status`, { status: "accepted" });
    if (!result.ok) {
      setMessage(result.summary ?? "Accepteren lukte niet.");
      return;
    }
    track("adventure_accepted", { mode: view.mode });
    setStatusOverride("accepted");
    if (result.mapsUrl) setMapsOverride(result.mapsUrl);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {!revealed ? (
        <AdventureWheel
          key={selection.winnerId}
          segments={selection.wheel}
          winnerId={selection.winnerId}
          onRevealed={() => {
            setRevealed(true);
            track("spin_completed", { mode: view.mode });
          }}
        />
      ) : (
        <article className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
          <div className="bg-forest-900 px-5 py-8 text-cream-50">
            <p className="text-sm uppercase tracking-[0.2em] text-gold-400">{selection.category}</p>
            <h1 className="mt-2 font-display text-4xl">{selection.name}</h1>
            <p className="mt-2 text-cream-100">{selection.address}</p>
          </div>
          <div className="space-y-4 px-5 py-6">
            <p className="text-lg">{selection.description}</p>
            <p className="rounded-2xl bg-cream-100 p-3 text-sm">Sfeerbeeld ontbreekt. We tonen geen foto die niet van deze plek is.</p>
            <section>
              <h2 className="font-display text-2xl">Waarom deze</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {selection.explanation.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="font-semibold">Leeftijd</dt><dd>{selection.ageNote}</dd></div>
              <div><dt className="font-semibold">Weer</dt><dd>{selection.weatherSummary} Status: {selection.weatherStatus}.{selection.temperatureC !== null ? ` ${Math.round(selection.temperatureC)} °C.` : ""}</dd></div>
              <div><dt className="font-semibold">Opening</dt><dd>{selection.hoursLabel}</dd></div>
              <div><dt className="font-semibold">Afstand</dt><dd>{selection.distanceLabel}</dd></div>
              <div><dt className="font-semibold">Reistijd</dt><dd>{selection.travelLabel}</dd></div>
              <div><dt className="font-semibold">Entree</dt><dd>{selection.entranceLabel}</dd></div>
              <div className="sm:col-span-2"><dt className="font-semibold">Toegankelijkheid</dt><dd>{selection.accessibilityLabel}</dd></div>
            </dl>
            <p className="text-sm text-ink-soft">{selection.probabilityLabel}</p>
            {view.promotion ? (
              <aside className="rounded-3xl border border-gold-400 bg-cream-50 p-4">
                <p className="font-semibold">Extra voordeel bij deze bestemming</p>
                <p className="mt-1">{view.promotion.title}</p>
                <p className="text-sm">{view.promotion.description}</p>
                <p className="text-sm">Geldig tot {view.promotion.validUntil}. {view.promotion.terms}</p>
                <p className="text-sm">Dit voordeel is pas na de draai opgezocht en heeft de keuze niet beïnvloed.</p>
                {view.promotion.redemptionUrl ? (
                  <a className="mt-2 inline-block font-semibold text-forest-800 underline" href={view.promotion.redemptionUrl} onClick={() => track("promotion_clicked", { id: view.promotion?.id ?? "" })}>
                    Naar de actie
                  </a>
                ) : null}
              </aside>
            ) : null}
            {view.affiliate ? (
              <p className="text-sm">
                Ticketlink via partner:{" "}
                <a className="font-semibold underline" href={view.affiliate.url} onClick={() => track("affiliate_clicked", { id: view.affiliate?.id ?? "" })}>
                  {view.affiliate.label}
                </a>
                . Dit heeft de keuze niet beïnvloed.
              </p>
            ) : null}
          </div>
        </article>
      )}

      {revealed && !view.shared ? (
        <div className="space-y-3">
          {status === "suggested" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button onClick={() => void accept()}>Dit wordt &apos;m!</Button>
              <Button variant="quiet" disabled={!canRespin} onClick={() => setAsking(true)}>
                {canRespin ? "Eén keer opnieuw draaien" : "Herkansing gebruikt"}
              </Button>
            </div>
          ) : null}
          {mapsUrl ? (
            <a
              className="touch-target flex w-full items-center justify-center rounded-full bg-forest-800 px-5 py-3 text-lg font-semibold text-cream-50"
              href={mapsUrl}
              onClick={() => {
                track("maps_opened", { shared: false });
                void post(`/api/avonturen/${view.id}/status`, { status: "route_opened" });
              }}
            >
              Open in Google Maps
            </a>
          ) : null}
          {status !== "suggested" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="quiet" onClick={async () => {
                const result = await post(`/api/avonturen/${view.id}/lunch`);
                setMessage(result.summary ?? (result.ok ? "Lunch toegevoegd." : "Geen lunch gevonden."));
                if (result.ok) {
                  track("lunch_added", { mode: view.mode });
                  router.refresh();
                }
              }}>Voeg lunch toe</Button>
              <Button variant="quiet" onClick={async () => {
                const result = await post(`/api/avonturen/${view.id}/tussenstop`);
                setMessage(result.summary ?? (result.ok ? "Tussenstop toegevoegd." : "Geen tussenstop gevonden."));
                if (result.ok) {
                  track("return_stop_added", { mode: view.mode });
                  router.refresh();
                }
              }}>Voeg tussenstop toe</Button>
            </div>
          ) : null}
          {view.lunch ? <p className="rounded-2xl bg-cream-100 p-3 text-sm">Lunch: {view.lunch.name}. {view.lunch.reason}</p> : null}
          {view.returnStop ? <p className="rounded-2xl bg-cream-100 p-3 text-sm">Tussenstop: {view.returnStop.name}. {view.returnStop.reason}</p> : null}
          {(view.lunch || view.returnStop) ? <AdSlot placement="itinerary" /> : null}
          <p className="text-sm text-ink-soft">Op sommige telefoons opent Google Maps maar een paar tussenstops. Lukt de hele route niet, dan blijft de bestemming zelf bereikbaar.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={async () => {
              const url = `${window.location.origin}${view.sharePath}`;
              if (navigator.share) await navigator.share({ title: selection.name, url });
              else await navigator.clipboard.writeText(url);
              track("adventure_shared", { mode: view.mode });
              setMessage("Deellink gekopieerd of gedeeld. Je startpunt zit er niet in.");
            }}>Deel avontuur</Button>
            <Button variant="ghost" onClick={async () => {
              await post(`/api/avonturen/${view.id}/favoriet`, { favorite: !view.favorite });
              router.refresh();
            }}>{view.favorite ? "Bewaard" : "Bewaar"}</Button>
            {status !== "visit_self_confirmed" ? (
              <Button variant="ghost" onClick={async () => {
                await post(`/api/avonturen/${view.id}/status`, { status: "visit_self_confirmed" });
                track("visit_self_confirmed", { mode: view.mode });
                setStatusOverride("visit_self_confirmed");
                router.refresh();
              }}>Ik ben geweest</Button>
            ) : (
              <Button variant="ghost" onClick={async () => {
                await post(`/api/avonturen/${view.id}/status`, { status: "not_visited" });
                setStatusOverride("not_visited");
                router.refresh();
              }}>Toch niet geweest</Button>
            )}
            <Button variant="ghost" onClick={async () => {
              const result = await post(`/api/avonturen/${view.id}/vervangen`);
              setMessage(result.summary ?? "Alternatief gezocht zonder je herkansing te gebruiken.");
              if (result.ok) {
                setStatusOverride("suggested");
                setMapsOverride(null);
                setRevealed(false);
                router.refresh();
              }
            }}>Gesloten of onveilig? Ander voorstel</Button>
          </div>
          {status === "visit_self_confirmed" ? (
            <form className="space-y-3 rounded-3xl bg-white p-4" onSubmit={async (event) => {
              event.preventDefault();
              const result = await post("/api/reviews", { sessionId: view.id, rating, body: review, tags });
              setMessage(result.summary ?? (result.status === "held" ? "Je review wordt eerst bekeken." : "Review opgeslagen."));
              track("review_submitted", { rating });
            }}>
              <h2 className="font-display text-2xl">Hoe was het?</h2>
              <p className="text-sm">Dit is een eigen bevestiging, geen onafhankelijke check. {signedIn ? "" : "Log in om de review aan je account te hangen."}</p>
              <label className="block text-sm font-semibold" htmlFor="sterren">Sterren: {rating}
                <input id="sterren" type="range" min={1} max={5} value={rating} onChange={(event) => setRating(Number(event.target.value))} className="w-full" />
              </label>
              <textarea value={review} onChange={(event) => setReview(event.target.value)} className="w-full rounded-2xl border border-cream-200 p-3" placeholder="Optioneel verhaal" />
              <div className="flex flex-wrap gap-2">
                {REVIEW_TAGS.map((tag) => (
                  <button key={tag} type="button" className={`rounded-full px-3 py-2 text-sm ${tags.includes(tag) ? "bg-forest-800 text-cream-50" : "bg-cream-100"}`} onClick={() => setTags(tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag])}>
                    {tag}
                  </button>
                ))}
              </div>
              <Button type="submit" disabled={!signedIn}>Verstuur review</Button>
            </form>
          ) : null}
        </div>
      ) : null}

      {view.shared && view.publicRoute ? (
        <RouteFromHere
          destination={view.publicRoute.destination}
          waypoints={view.publicRoute.waypoints}
          travelMode={view.publicRoute.travelMode}
          destinationHref={view.mapsUrl}
        />
      ) : null}

      {asking ? (
        <form className="space-y-3 rounded-3xl bg-forest-950 p-4 text-cream-50" onSubmit={async (event) => {
          event.preventDefault();
          const result = await post(`/api/avonturen/${view.id}/opnieuw`, { reason, note });
          track("respin_requested", { reason });
          if (!result.ok) {
            setMessage(result.summary ?? "Opnieuw draaien lukte niet.");
            return;
          }
          setAsking(false);
          setRespinLocked(true);
          setRevealed(false);
          setStatusOverride("suggested");
          setMapsOverride(null);
          router.refresh();
        }}>
          <h2 className="font-display text-2xl">Waarom wil je opnieuw draaien?</h2>
          {REASONS.map(([value, label]) => (
            <label key={value} className="flex gap-3">
              <input type="radio" name="reden" checked={reason === value} onChange={() => setReason(value)} />
              {label}
            </label>
          ))}
          <label className="block text-sm" htmlFor="toelichting">Toelichting, optioneel
            <textarea id="toelichting" value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 w-full rounded-2xl p-3 text-ink" />
          </label>
          <Button type="submit" variant="gold">Draai opnieuw</Button>
        </form>
      ) : null}
      {message ? <p role="status" className="rounded-2xl bg-cream-100 p-3">{message}</p> : null}
      <AdSlot placement="below-result" />
      <footer className="text-xs text-ink-soft">
        <p>{view.sources.places}</p>
        <p>{view.sources.routes}</p>
        <p>Weer: {view.sources.weather}. {view.sources.storage}</p>
      </footer>
    </div>
  );
}
