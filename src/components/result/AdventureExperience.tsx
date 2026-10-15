"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { AdventureWheel } from "@/components/wheel/AdventureWheel";
import { Button } from "@/components/ui/Button";
import { choiceClass, fieldClass } from "@/components/ui/choice";
import { REVIEW_TAGS } from "@/content/reviews";
import type { AdventureView } from "@/application/view";
import { useCopy } from "@/i18n/context";
import { fill } from "@/i18n/dictionary";

const REASONS = ["been_there", "not_appealing", "not_practical", "want_different", "other"] as const;

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
  const { t } = useCopy();
  const [revealed, setRevealed] = useState(view.shared);
  const [statusOverride, setStatusOverride] = useState<AdventureView["status"] | null>(null);
  const [mapsOverride, setMapsOverride] = useState<string | null | undefined>(undefined);
  const [respinLocked, setRespinLocked] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]>("not_appealing");
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
    return <p>{t.result.empty}</p>;
  }

  async function accept() {
    const result = await post(`/api/avonturen/${view.id}/status`, { status: "accepted" });
    if (!result.ok) {
      setMessage(result.summary ?? t.result.acceptFailed);
      return;
    }
    track("adventure_accepted", { mode: view.mode });
    setStatusOverride("accepted");
    if (result.mapsUrl) setMapsOverride(result.mapsUrl);
    router.refresh();
  }

  const temperature = selection.temperatureC !== null ? ` ${Math.round(selection.temperatureC)} °C.` : "";

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
        <article className="overflow-hidden rounded-card bg-cream-50 shadow-soft">
          <div className="bg-forest-900 px-5 py-8 text-cream-50">
            <p className="text-sm uppercase tracking-[0.2em] text-gold-400">{selection.category}</p>
            <h1 className="mt-2 font-display text-4xl text-cream-50">{selection.name}</h1>
            <p className="mt-2 text-cream-100">{selection.address}</p>
          </div>
          <div className="space-y-4 px-5 py-6">
            <p className="text-lg">{selection.description}</p>
            <p className="rounded-input bg-cream-100 p-3 text-sm">{t.result.noPhoto}</p>
            <section>
              <h2 className="font-display text-2xl text-forest-950">{t.result.why}</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {selection.explanation.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold">{t.result.age}</dt>
                <dd>{selection.ageNote}</dd>
              </div>
              <div>
                <dt className="font-semibold">{t.result.weather}</dt>
                <dd>
                  {selection.weatherSummary} {fill(t.result.weatherStatus, { status: selection.weatherStatus, temperature })}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">{t.result.opening}</dt>
                <dd>{selection.hoursLabel}</dd>
              </div>
              <div>
                <dt className="font-semibold">{t.result.distance}</dt>
                <dd>{selection.distanceLabel}</dd>
              </div>
              <div>
                <dt className="font-semibold">{t.result.travel}</dt>
                <dd>{selection.travelLabel}</dd>
              </div>
              <div>
                <dt className="font-semibold">{t.result.entrance}</dt>
                <dd>{selection.entranceLabel}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-semibold">{t.result.access}</dt>
                <dd>{selection.accessibilityLabel}</dd>
              </div>
            </dl>
            <p className="text-sm text-ink-soft">{selection.probabilityLabel}</p>
            {view.promotion ? (
              <aside className="rounded-card border border-gold-700 bg-cream-50 p-4">
                <p className="font-semibold">{t.result.promotion}</p>
                <p className="mt-1">{view.promotion.title}</p>
                <p className="text-sm">{view.promotion.description}</p>
                <p className="text-sm">{fill(t.result.promotionUntil, { until: view.promotion.validUntil, terms: view.promotion.terms })}</p>
                <p className="text-sm">{t.result.promotionIndependence}</p>
                {view.promotion.redemptionUrl ? (
                  <a className="mt-2 inline-block font-semibold text-forest-800 underline" href={view.promotion.redemptionUrl} onClick={() => track("promotion_clicked", { id: view.promotion?.id ?? "" })}>
                    {t.result.promotionLink}
                  </a>
                ) : null}
              </aside>
            ) : null}
            {view.affiliate ? (
              <p className="text-sm">
                {t.result.affiliate}{" "}
                <a className="font-semibold underline" href={view.affiliate.url} onClick={() => track("affiliate_clicked", { id: view.affiliate?.id ?? "" })}>
                  {view.affiliate.label}
                </a>
                . {t.result.affiliateIndependence}
              </p>
            ) : null}
          </div>
        </article>
      )}

      {revealed && !view.shared ? (
        <div className="space-y-3">
          {status === "suggested" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button onClick={() => void accept()}>{t.result.accept}</Button>
              <Button variant="quiet" disabled={!canRespin} onClick={() => setAsking(true)}>
                {canRespin ? t.result.respin : t.result.respinUsed}
              </Button>
            </div>
          ) : null}
          {mapsUrl ? (
            <a
              className="touch-target flex w-full items-center justify-center rounded-full bg-forest-800 px-5 py-3 font-display text-lg font-semibold text-cream-50"
              href={mapsUrl}
              onClick={() => {
                track("maps_opened", { shared: false });
                void post(`/api/avonturen/${view.id}/status`, { status: "route_opened" });
              }}
            >
              {t.result.maps}
            </a>
          ) : null}
          {status !== "suggested" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="quiet"
                onClick={async () => {
                  const result = await post(`/api/avonturen/${view.id}/lunch`);
                  setMessage(result.summary ?? (result.ok ? t.result.lunchAdded : t.result.lunchMissing));
                  if (result.ok) {
                    track("lunch_added", { mode: view.mode });
                    router.refresh();
                  }
                }}
              >
                {t.result.addLunch}
              </Button>
              <Button
                variant="quiet"
                onClick={async () => {
                  const result = await post(`/api/avonturen/${view.id}/tussenstop`);
                  setMessage(result.summary ?? (result.ok ? t.result.stopAdded : t.result.stopMissing));
                  if (result.ok) {
                    track("return_stop_added", { mode: view.mode });
                    router.refresh();
                  }
                }}
              >
                {t.result.addStop}
              </Button>
            </div>
          ) : null}
          {view.lunch ? <p className="rounded-input bg-cream-100 p-3 text-sm">{fill(t.result.lunch, { name: view.lunch.name, reason: view.lunch.reason })}</p> : null}
          {view.returnStop ? <p className="rounded-input bg-cream-100 p-3 text-sm">{fill(t.result.stop, { name: view.returnStop.name, reason: view.returnStop.reason })}</p> : null}
          {view.lunch || view.returnStop ? <AdSlot placement="itinerary" /> : null}
          <p className="text-sm text-ink-soft">{t.result.mapsNote}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              onClick={async () => {
                const url = `${window.location.origin}${view.sharePath}`;
                if (navigator.share) await navigator.share({ title: selection.name, url });
                else await navigator.clipboard.writeText(url);
                track("adventure_shared", { mode: view.mode });
                setMessage(t.result.shared);
              }}
            >
              {t.result.share}
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await post(`/api/avonturen/${view.id}/favoriet`, { favorite: !view.favorite });
                router.refresh();
              }}
            >
              {view.favorite ? t.result.saved : t.result.save}
            </Button>
            {status !== "visit_self_confirmed" ? (
              <Button
                variant="ghost"
                onClick={async () => {
                  await post(`/api/avonturen/${view.id}/status`, { status: "visit_self_confirmed" });
                  track("visit_self_confirmed", { mode: view.mode });
                  setStatusOverride("visit_self_confirmed");
                  router.refresh();
                }}
              >
                {t.result.visited}
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={async () => {
                  await post(`/api/avonturen/${view.id}/status`, { status: "not_visited" });
                  setStatusOverride("not_visited");
                  router.refresh();
                }}
              >
                {t.result.notVisited}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={async () => {
                const result = await post(`/api/avonturen/${view.id}/vervangen`);
                setMessage(result.summary ?? t.result.replaced);
                if (result.ok) {
                  setStatusOverride("suggested");
                  setMapsOverride(null);
                  setRevealed(false);
                  router.refresh();
                }
              }}
            >
              {t.result.replace}
            </Button>
          </div>
          {status === "visit_self_confirmed" ? (
            <form
              className="space-y-3 rounded-card bg-cream-100 p-4"
              onSubmit={async (event) => {
                event.preventDefault();
                const result = await post("/api/reviews", { sessionId: view.id, rating, body: review, tags });
                setMessage(result.summary ?? (result.status === "held" ? t.result.reviewHeld : t.result.reviewSaved));
                track("review_submitted", { rating });
              }}
            >
              <h2 className="font-display text-2xl text-forest-950">{t.result.reviewTitle}</h2>
              <p className="text-sm">
                {t.result.reviewNote} {signedIn ? "" : t.result.reviewSignIn}
              </p>
              <label className="block text-sm font-semibold" htmlFor="sterren">
                {fill(t.result.stars, { rating })}
                <input id="sterren" type="range" min={1} max={5} value={rating} onChange={(event) => setRating(Number(event.target.value))} className="w-full accent-forest-800" />
              </label>
              <textarea value={review} onChange={(event) => setReview(event.target.value)} className={fieldClass} placeholder={t.result.reviewPlaceholder} />
              <div className="flex flex-wrap gap-2">
                {REVIEW_TAGS.map((tag) => (
                  <button key={tag} type="button" className={choiceClass(tags.includes(tag))} onClick={() => setTags(tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag])}>
                    {t.reviewTag[tag]}
                  </button>
                ))}
              </div>
              <Button type="submit" disabled={!signedIn}>
                {t.result.reviewSubmit}
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}

      {view.shared && view.mapsUrl ? (
        <a className="touch-target flex w-full items-center justify-center rounded-full bg-forest-800 px-5 py-3 font-display font-semibold text-cream-50" href={view.mapsUrl}>
          {t.result.sharedMaps}
        </a>
      ) : null}

      {asking ? (
        <form
          className="space-y-3 rounded-card bg-forest-950 p-4 text-cream-50"
          onSubmit={async (event) => {
            event.preventDefault();
            const result = await post(`/api/avonturen/${view.id}/opnieuw`, { reason, note });
            track("respin_requested", { reason });
            if (!result.ok) {
              setMessage(result.summary ?? t.result.respinFailed);
              return;
            }
            setAsking(false);
            setRespinLocked(true);
            setRevealed(false);
            setStatusOverride("suggested");
            setMapsOverride(null);
            router.refresh();
          }}
        >
          <h2 className="font-display text-2xl text-cream-50">{t.result.respinTitle}</h2>
          {REASONS.map((value) => (
            <label key={value} className="flex gap-3">
              <input type="radio" name="reden" checked={reason === value} onChange={() => setReason(value)} />
              {t.reasons[value]}
            </label>
          ))}
          <label className="block text-sm" htmlFor="toelichting">
            {t.result.respinNote}
            <textarea id="toelichting" value={note} onChange={(event) => setNote(event.target.value)} className={`${fieldClass} text-ink`} />
          </label>
          <Button type="submit" variant="gold">
            {t.result.respinAgain}
          </Button>
        </form>
      ) : null}
      {message ? (
        <p role="status" className="rounded-input bg-cream-100 p-3">
          {message}
        </p>
      ) : null}
      <AdSlot placement="below-result" />
      <footer className="text-xs text-ink-soft">
        <p>{view.sources.places}</p>
        <p>{view.sources.routes}</p>
        <p>
          {t.result.weather}: {view.sources.weather}. {view.sources.storage}
        </p>
      </footer>
    </div>
  );
}
