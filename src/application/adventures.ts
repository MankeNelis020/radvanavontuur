import { adventureCatalog, lunchCatalog, type CatalogDestination } from "@/data/catalog";
import { evaluateConstraints } from "@/domain/engine/constraints";
import { recommend } from "@/domain/engine/recommend";
import { suitabilityScore } from "@/domain/engine/scoring";
import { pickLunch, pickReturnStop, type SidePick } from "@/domain/itinerary";
import { googleMapsDirectionsUrl, travelModeParam, type MapPoint } from "@/domain/maps";
import type { ResolvedPreferences } from "@/domain/preferences";
import { findAffiliateAfterSelection, findPromotionAfterSelection } from "@/domain/promotions/promotion-service";
import type { PromotionView } from "@/domain/promotions/types";
import type { EngineDestination, RespinReason, VisitStatus } from "@/domain/types";
import { createPlacesProvider } from "@/providers/places/google-places";
import { createRoutesProvider } from "@/providers/routes/google-routes";
import { createWeatherProvider, unavailableWeather } from "@/providers/weather/open-meteo";
import { getStore, storageLabel } from "@/persistence/get-store";
import type { AppStore, SelectionRecord, StoredSession } from "@/persistence/types";

const ROUTE_BUDGET = 4;

export type AdventureDeps = {
  store: AppStore;
  now: Date;
};

function deps(): AdventureDeps {
  return { store: getStore(), now: new Date() };
}

function thaw(preferences: StoredSession["preferences"]): ResolvedPreferences {
  return { ...preferences, arrival: new Date(preferences.arrival) };
}

function freeze(preferences: ResolvedPreferences): StoredSession["preferences"] {
  return { ...preferences, arrival: preferences.arrival.toISOString() };
}

async function pool<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      const item = items[index];
      if (item !== undefined) results[index] = await task(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function loadDestinations(store: AppStore): Promise<CatalogDestination[]> {
  const overrides = await store.listOverrides();
  const byId = new Map(adventureCatalog().map((destination) => [destination.id, destination]));
  for (const override of overrides) {
    if (override.roles.includes("adventure")) byId.set(override.id, override);
  }
  return Array.from(byId.values());
}

function diversify<T extends { destination: EngineDestination }>(candidates: T[], limit = 12): T[] {
  const picked: T[] = [];
  const indoor = candidates.filter((candidate) => candidate.destination.environment !== "outdoor");
  for (const candidate of indoor.slice(0, 4)) picked.push(candidate);
  for (const candidate of candidates) {
    if (picked.length >= limit) break;
    if (!picked.includes(candidate)) picked.push(candidate);
  }
  return picked;
}

async function choose(input: {
  preferences: ResolvedPreferences;
  store: AppStore;
  seed: string;
  excludeIds: string[];
  respinReason: RespinReason | null;
  previous: { category: string; environment: EngineDestination["environment"] } | null;
}): Promise<{ recommendation: ReturnType<typeof recommend>; sources: StoredSession["sources"] }> {
  const places = createPlacesProvider();
  const routes = createRoutesProvider();
  const weather = createWeatherProvider();
  const catalog = await loadDestinations(input.store);
  let placeNote = "Eigen catalogus.";
  let destinations: EngineDestination[] = catalog;
  try {
    const enriched = await places.enrich({
      origin: input.preferences.origin,
      radiusMeters: input.preferences.maxDistanceKm * 1000,
      catalog,
    });
    destinations = enriched.destinations;
    placeNote = enriched.note;
  } catch {
    placeNote = "Google Places was niet bereikbaar. De eigen catalogus is gebruikt.";
  }

  const preliminary = destinations
    .map((destination) => {
      const decision = evaluateConstraints(destination, input.preferences, null, null);
      if (!decision.ok) return null;
      return {
        destination,
        distanceKm: decision.context.distanceKm,
        score: suitabilityScore(destination, input.preferences, 1),
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);

  const shortlist = diversify(preliminary);
  const travelMinutesById: Record<string, number | null> = {};
  if (routes.mode === "live" && input.preferences.transportation) {
    const mode = input.preferences.transportation;
    const quoted = await pool(shortlist.slice(0, ROUTE_BUDGET), 2, async (candidate) => {
      try {
        const quote = await routes.quote({
          origin: input.preferences.origin,
          destination: { lat: candidate.destination.latitude, lng: candidate.destination.longitude },
          mode,
        });
        return { id: candidate.destination.id, minutes: quote ? Math.round(quote.durationSeconds / 60) : null };
      } catch {
        return { id: candidate.destination.id, minutes: null };
      }
    });
    for (const item of quoted) travelMinutesById[item.id] = item.minutes;
  }

  const weatherById: Record<string, Awaited<ReturnType<typeof weather.getForecast>> | null> = {};
  const forecasts = await pool(shortlist, 4, async (candidate) => {
    try {
      const snapshot = await weather.getForecast({
        latitude: candidate.destination.latitude,
        longitude: candidate.destination.longitude,
        at: input.preferences.arrival,
      });
      return { id: candidate.destination.id, snapshot };
    } catch {
      return {
        id: candidate.destination.id,
        snapshot: unavailableWeather("De weersverwachting voor deze bestemming kon niet worden opgehaald."),
      };
    }
  });
  for (const forecast of forecasts) weatherById[forecast.id] = forecast.snapshot;

  const recommendation = recommend({
    destinations: shortlist.map((candidate) => candidate.destination),
    preferences: input.preferences,
    weatherById,
    travelMinutesById,
    seed: input.seed,
    excludeIds: input.excludeIds,
    respinReason: input.respinReason,
    previous: input.previous,
  });

  return {
    recommendation,
    sources: {
      places: placeNote,
      routes: routes.mode === "live" ? routes.label : "Reistijd niet beschikbaar: Google Routes is niet geconfigureerd of gaf geen resultaat.",
      weather: weather.label,
      storage: storageLabel(input.store),
    },
  };
}

function toSelection(
  recommendation: Extract<ReturnType<typeof recommend>, { ok: true }>,
  kind: SelectionRecord["kind"],
): SelectionRecord {
  const winner = recommendation.winner;
  return {
    id: crypto.randomUUID(),
    destination: winner.destination,
    probability: winner.probability,
    explanation: recommendation.explanation,
    weather: winner.weather,
    hoursLabel: winner.hoursLabel,
    hoursStatus: winner.hoursStatus,
    distanceKm: winner.distanceKm,
    travel:
      winner.travelMinutes === null
        ? null
        : {
            durationMinutes: winner.travelMinutes,
            source: "google_routes",
            fetchedAt: new Date().toISOString(),
          },
    wheel: recommendation.wheel,
    kind,
    promotion: null,
    createdAt: new Date().toISOString(),
  };
}

export async function createAdventure(input: {
  preferences: ResolvedPreferences;
  ownerToken: string;
  userId: string | null;
  visitedIds: string[];
}): Promise<{ ok: true; session: StoredSession } | { ok: false; summary: string; rejected: { id: string; message: string }[] }> {
  const { store, now } = deps();
  const preferences = {
    ...input.preferences,
    visitedDestinationIds: input.preferences.avoidVisited
      ? Array.from(new Set([...input.preferences.visitedDestinationIds, ...input.visitedIds]))
      : [],
  };
  const seed = crypto.randomUUID();
  const outcome = await choose({
    preferences,
    store,
    seed,
    excludeIds: [],
    respinReason: null,
    previous: null,
  });
  if (!outcome.recommendation.ok) {
    return { ok: false, summary: outcome.recommendation.summary, rejected: outcome.recommendation.rejected };
  }
  const selection = toSelection(outcome.recommendation, "primary");
  const session: StoredSession = {
    id: crypto.randomUUID(),
    shareToken: crypto.randomUUID(),
    ownerToken: input.ownerToken,
    userId: input.userId,
    createdAt: now.toISOString(),
    preferences: freeze(preferences),
    status: "suggested",
    respinUsed: false,
    respinReason: null,
    respinNote: null,
    operationalReplacements: 0,
    selections: [selection],
    activeIndex: 0,
    lunch: null,
    returnStop: null,
    favorite: false,
    seed,
    sources: outcome.sources,
  };
  await store.createSession(session);
  return { ok: true, session };
}

async function owned(id: string, ownerToken: string): Promise<StoredSession> {
  const session = await getStore().getSession(id);
  if (!session || session.ownerToken !== ownerToken) {
    throw new Error("Dit avontuur hoort niet bij deze browser.");
  }
  return session;
}

export async function respinAdventure(input: {
  sessionId: string;
  ownerToken: string;
  reason: RespinReason;
  note: string | null;
}): Promise<{ ok: true; session: StoredSession } | { ok: false; summary: string }> {
  const store = getStore();
  const session = await owned(input.sessionId, input.ownerToken);
  if (session.respinUsed) {
    return { ok: false, summary: "Je hebt de ene herkansing van deze sessie al gebruikt." };
  }
  const current = session.selections[session.activeIndex];
  if (!current) return { ok: false, summary: "Er is nog geen bestemming om te vervangen." };
  const preferences = thaw(session.preferences);
  const outcome = await choose({
    preferences,
    store,
    seed: `${session.seed}:opnieuw`,
    excludeIds: session.selections.map((selection) => selection.destination.id),
    respinReason: input.reason,
    previous: { category: current.destination.category, environment: current.destination.environment },
  });
  if (!outcome.recommendation.ok) {
    return {
      ok: false,
      summary: "Er is geen ander avontuur binnen je grenzen. Je herkansing is niet verbruikt.",
    };
  }
  session.selections.push(toSelection(outcome.recommendation, "respin"));
  session.activeIndex = session.selections.length - 1;
  session.respinUsed = true;
  session.respinReason = input.reason;
  session.respinNote = input.note;
  session.lunch = null;
  session.returnStop = null;
  session.status = "suggested";
  await store.saveSession(session);
  return { ok: true, session };
}

export async function replaceAdventure(input: {
  sessionId: string;
  ownerToken: string;
}): Promise<{ ok: true; session: StoredSession } | { ok: false; summary: string }> {
  const store = getStore();
  const session = await owned(input.sessionId, input.ownerToken);
  const preferences = thaw(session.preferences);
  const outcome = await choose({
    preferences,
    store,
    seed: `${session.seed}:vervanging:${session.operationalReplacements + 1}`,
    excludeIds: session.selections.map((selection) => selection.destination.id),
    respinReason: null,
    previous: null,
  });
  if (!outcome.recommendation.ok) {
    return { ok: false, summary: "Er is geen operationeel alternatief binnen je grenzen." };
  }
  session.selections.push(toSelection(outcome.recommendation, "replacement"));
  session.activeIndex = session.selections.length - 1;
  session.operationalReplacements += 1;
  session.lunch = null;
  session.returnStop = null;
  session.status = "suggested";
  await store.saveSession(session);
  return { ok: true, session };
}

export async function updateStatus(input: {
  sessionId: string;
  ownerToken: string;
  status: VisitStatus;
  userId: string | null;
}): Promise<StoredSession> {
  const store = getStore();
  const session = await owned(input.sessionId, input.ownerToken);
  session.status = input.status;
  if (input.userId) session.userId = session.userId ?? input.userId;
  if (input.status === "visit_self_confirmed" && session.userId) {
    const current = session.selections[session.activeIndex];
    if (current) await store.markVisited(session.userId, current.destination.id, session.id);
  }
  await store.saveSession(session);
  return session;
}

export async function setFavorite(sessionId: string, ownerToken: string, userId: string | null, favorite: boolean) {
  const store = getStore();
  const session = await owned(sessionId, ownerToken);
  session.favorite = favorite;
  const current = session.selections[session.activeIndex];
  if (favorite && userId && current) await store.addFavorite(userId, current.destination.id);
  await store.saveSession(session);
  return session;
}

async function sideOptions(store: AppStore): Promise<CatalogDestination[]> {
  const overrides = await store.listOverrides();
  return [...lunchCatalog(), ...adventureCatalog(), ...overrides];
}

export async function addLunch(sessionId: string, ownerToken: string): Promise<{ ok: true; session: StoredSession } | { ok: false; summary: string }> {
  const store = getStore();
  const session = await owned(sessionId, ownerToken);
  const current = session.selections[session.activeIndex];
  if (!current) return { ok: false, summary: "Kies eerst een avontuur." };
  const preferences = thaw(session.preferences);
  const spent = current.destination.entrance.model === "free" ? 0 : null;
  const remaining =
    preferences.budgetEur === null ? null : spent === null ? preferences.budgetEur : Math.max(0, preferences.budgetEur - spent);
  const lunch = pickLunch({
    main: current.destination,
    options: await sideOptions(store),
    participants: preferences.participants,
    accessibility: preferences.accessibility,
    remainingBudgetEur: remaining,
    seed: `${session.seed}:lunch`,
  });
  if (!lunch) {
    return { ok: false, summary: "Geen lunchpunt binnen 8 km dat aan je grenzen voldoet. Er is niets verzonnen." };
  }
  session.lunch = lunch;
  await store.saveSession(session);
  return { ok: true, session };
}

export async function addReturnStop(sessionId: string, ownerToken: string): Promise<{ ok: true; session: StoredSession } | { ok: false; summary: string }> {
  const store = getStore();
  const session = await owned(sessionId, ownerToken);
  const current = session.selections[session.activeIndex];
  if (!current) return { ok: false, summary: "Kies eerst een avontuur." };
  const preferences = thaw(session.preferences);
  const used = current.destination.estimatedDurationMinutes + (session.lunch ? session.lunch.destination.estimatedDurationMinutes : 0);
  const remainingMinutes = preferences.availableMinutes - used;
  if (remainingMinutes < 30) {
    return { ok: false, summary: "Na het avontuur blijft te weinig tijd over voor een tussenstop. Reistijd is hier niet bijgeteld, omdat die niet is berekend." };
  }
  const stop = pickReturnStop({
    origin: preferences.origin,
    main: current.destination,
    options: await loadDestinations(store),
    participants: preferences.participants,
    accessibility: preferences.accessibility,
    remainingBudgetEur: preferences.budgetEur,
    remainingMinutes,
    seed: `${session.seed}:tussenstop`,
    blockedIds: [current.destination.id, session.lunch?.destination.id ?? ""],
  });
  if (!stop) {
    return { ok: false, summary: "Geen tussenstop die de omweg klein houdt en binnen je grenzen past." };
  }
  session.returnStop = stop;
  await store.saveSession(session);
  return { ok: true, session };
}

export async function promotionFor(session: StoredSession): Promise<PromotionView | null> {
  const current = session.selections[session.activeIndex];
  if (!current) return null;
  const store = getStore();
  const [promotions, partners] = await Promise.all([store.listPromotions(), store.listPartners()]);
  return findPromotionAfterSelection(promotions, partners, current.destination.id, new Date(session.preferences.arrival));
}

export async function affiliateFor(session: StoredSession) {
  const current = session.selections[session.activeIndex];
  if (!current) return null;
  const offers = await getStore().listAffiliates();
  return findAffiliateAfterSelection(offers, current.destination.id, process.env.AFFILIATE_ENABLED === "true");
}

export function mapsUrlFor(session: StoredSession, includeOrigin: boolean): string | null {
  const current = session.selections[session.activeIndex];
  const accepted =
    session.status === "accepted" ||
    session.status === "route_opened" ||
    session.status === "visit_self_confirmed";
  if (!current || (includeOrigin && !accepted)) return null;
  const preferences = thaw(session.preferences);
  const destination: MapPoint = {
    lat: current.destination.latitude,
    lng: current.destination.longitude,
    name: current.destination.name,
    placeId: current.destination.providerPlaceId,
  };
  const waypoints = [session.lunch, session.returnStop]
    .filter((stop): stop is SidePick => Boolean(stop))
    .map((stop) => ({
      lat: stop.destination.latitude,
      lng: stop.destination.longitude,
      name: stop.destination.name,
      placeId: stop.destination.providerPlaceId,
    }));
  return googleMapsDirectionsUrl({
    origin: includeOrigin
      ? { lat: preferences.origin.lat, lng: preferences.origin.lng, name: preferences.origin.label }
      : null,
    destination,
    waypoints,
    travelMode: travelModeParam(preferences.transportation),
    roundTrip: includeOrigin && waypoints.length > 0,
  });
}

export async function getOwnedSession(id: string, ownerToken: string) {
  return owned(id, ownerToken);
}

export async function getSharedSession(token: string) {
  return getStore().getByShareToken(token);
}

export function activeSelection(session: StoredSession): SelectionRecord | null {
  return session.selections[session.activeIndex] ?? null;
}
