import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CatalogDestination } from "@/data/catalog";
import type { AppStore, StoredSession } from "@/persistence/types";
import { createStateStore, emptyState } from "@/persistence/state-store";

function client(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is niet geconfigureerd.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Operationele opslag via de service-rol. De browser krijgt deze sleutel niet.
 * Partner- en promotietabellen worden alleen hier gelezen, nooit door de aanbevelingsmotor.
 */
export function createSupabaseStore(): AppStore {
  const supabase = client();
  const cache = emptyState();
  const base = createStateStore(cache, "supabase");

  return {
    ...base,
    mode: "supabase",
    async createSession(session) {
      const { error } = await supabase.from("adventure_sessions").insert(toRow(session));
      if (error) throw new Error(error.message);
      await base.createSession(session);
    },
    async getSession(id) {
      const { data, error } = await supabase.from("adventure_sessions").select("payload").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return (data?.payload as StoredSession | undefined) ?? null;
    },
    async getByShareToken(token) {
      const { data, error } = await supabase
        .from("adventure_sessions")
        .select("payload")
        .eq("share_token", token)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data?.payload as StoredSession | undefined) ?? null;
    },
    async saveSession(session) {
      const { error } = await supabase.from("adventure_sessions").update(toRow(session)).eq("id", session.id);
      if (error) throw new Error(error.message);
    },
    async listByOwner(ownerToken) {
      const { data, error } = await supabase
        .from("adventure_sessions")
        .select("payload")
        .eq("owner_token", ownerToken)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => row.payload as StoredSession);
    },
    async listByUser(userId) {
      const { data, error } = await supabase
        .from("adventure_sessions")
        .select("payload")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => row.payload as StoredSession);
    },
    async claimOwner(ownerToken, userId) {
      const sessions = await this.listByOwner(ownerToken);
      let count = 0;
      for (const session of sessions) {
        if (!session.userId) {
          session.userId = userId;
          await this.saveSession(session);
          count += 1;
        }
      }
      return count;
    },
    async listOverrides() {
      const { data, error } = await supabase.from("destinations").select("payload");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => row.payload as CatalogDestination);
    },
    async saveOverride(destination) {
      const { error } = await supabase.from("destinations").upsert({
        id: destination.id,
        provider_place_id: destination.providerPlaceId,
        name: destination.name,
        category: destination.category,
        latitude: destination.latitude,
        longitude: destination.longitude,
        payload: destination,
      });
      if (error) throw new Error(error.message);
    },
    async listPromotions() {
      const { data, error } = await supabase.from("promotions").select("payload");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => row.payload);
    },
    async savePromotion(promotion) {
      const { error } = await supabase.from("promotions").upsert({
        id: promotion.id,
        destination_id: promotion.destinationId,
        active: promotion.active,
        payload: promotion,
      });
      if (error) throw new Error(error.message);
    },
    async listPartners() {
      const { data, error } = await supabase.from("partners").select("payload");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => row.payload);
    },
    async savePartner(partner) {
      const { error } = await supabase.from("partners").upsert({
        id: partner.id,
        destination_id: partner.destinationId,
        agreement_status: partner.agreementStatus,
        payload: partner,
      });
      if (error) throw new Error(error.message);
    },
    async listAffiliates() {
      const { data, error } = await supabase.from("affiliate_offers").select("payload");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => row.payload);
    },
    async hasReview(userId, destinationId) {
      const { count, error } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("destination_id", destinationId);
      if (error) throw new Error(error.message);
      return (count ?? 0) > 0;
    },
    async addReview(review) {
      const { error } = await supabase.from("reviews").insert({
        id: review.id,
        destination_id: review.destinationId,
        user_id: review.userId,
        rating: review.rating,
        body: review.body,
        tags: review.tags,
        status: review.status,
        created_at: review.createdAt,
      });
      if (error) throw new Error(error.message);
    },
    async listReviews(destinationId) {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, destination_id, user_id, rating, body, tags, status, created_at, session_id")
        .eq("destination_id", destinationId)
        .eq("status", "published");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: row.id as string,
        destinationId: row.destination_id as string,
        userId: row.user_id as string,
        sessionId: (row.session_id as string | null) ?? "",
        rating: row.rating as number,
        body: (row.body as string) ?? "",
        tags: (row.tags as string[]) ?? [],
        createdAt: row.created_at as string,
        status: row.status as "published" | "held",
      }));
    },
    async listVisited(userId) {
      const { data, error } = await supabase.from("visited_destinations").select("destination_id").eq("user_id", userId);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => row.destination_id as string);
    },
    async markVisited(userId, destinationId, sessionId) {
      const { error } = await supabase.from("visited_destinations").upsert({
        user_id: userId,
        destination_id: destinationId,
        session_id: sessionId,
        confirmed_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
    },
    async addFavorite(userId, destinationId) {
      const { error } = await supabase.from("favorites").upsert({
        user_id: userId,
        destination_id: destinationId,
      });
      if (error) throw new Error(error.message);
    },
    async listFavorites(userId) {
      const { data, error } = await supabase.from("favorites").select("destination_id").eq("user_id", userId);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => row.destination_id as string);
    },
    async addAnalytics(event) {
      const { error } = await supabase.from("analytics_events").insert({
        id: event.id,
        name: event.name,
        created_at: event.createdAt,
        session_id: event.sessionId,
        properties: event.properties,
      });
      if (error) throw new Error(error.message);
    },
    async saveQuality(rows) {
      if (rows.length === 0) return;
      const { error } = await supabase.from("destination_data_quality").insert(
        rows.map((row) => ({
          destination_id: row.destinationId,
          field_name: row.fieldName,
          source: row.source,
          last_checked_at: row.lastCheckedAt || null,
          confidence: row.confidence,
          issue: row.issue,
          review_status: row.reviewStatus,
        })),
      );
      if (error) throw new Error(error.message);
    },
  };
}

function toRow(session: StoredSession) {
  return {
    id: session.id,
    share_token: session.shareToken,
    owner_token: session.ownerToken,
    user_id: session.userId,
    status: session.status,
    created_at: session.createdAt,
    payload: session,
  };
}

export function supabaseConfigured(): boolean {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
