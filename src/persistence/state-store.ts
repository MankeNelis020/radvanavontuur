import type { CatalogDestination } from "@/data/catalog";
import type { AffiliateOffer, PartnerRecord, PromotionRecord } from "@/domain/promotions/types";
import type { AnalyticsRecord, AppStore, QualityRecord, ReviewRecord, StoredSession } from "@/persistence/types";

export type StoreState = {
  sessions: StoredSession[];
  overrides: CatalogDestination[];
  promotions: PromotionRecord[];
  partners: PartnerRecord[];
  affiliates: AffiliateOffer[];
  reviews: ReviewRecord[];
  visited: { userId: string; destinationId: string; sessionId: string }[];
  favorites: { userId: string; destinationId: string }[];
  analytics: AnalyticsRecord[];
  quality: QualityRecord[];
};

export function emptyState(): StoreState {
  return {
    sessions: [],
    overrides: [],
    promotions: [],
    partners: [],
    affiliates: [],
    reviews: [],
    visited: [],
    favorites: [],
    analytics: [],
    quality: [],
  };
}

export function createStateStore(
  state: StoreState,
  mode: AppStore["mode"],
  afterWrite?: () => Promise<void>,
): AppStore {
  const touch = async () => {
    if (afterWrite) await afterWrite();
  };

  return {
    mode,
    async createSession(session) {
      state.sessions.push(structuredClone(session));
      await touch();
    },
    async getSession(id) {
      const session = state.sessions.find((item) => item.id === id);
      return session ? structuredClone(session) : null;
    },
    async getByShareToken(token) {
      const session = state.sessions.find((item) => item.shareToken === token);
      return session ? structuredClone(session) : null;
    },
    async saveSession(session) {
      const index = state.sessions.findIndex((item) => item.id === session.id);
      if (index < 0) throw new Error("Sessie ontbreekt.");
      state.sessions[index] = structuredClone(session);
      await touch();
    },
    async listByOwner(ownerToken) {
      return state.sessions
        .filter((session) => session.ownerToken === ownerToken)
        .map((session) => structuredClone(session));
    },
    async listByUser(userId) {
      return state.sessions
        .filter((session) => session.userId === userId)
        .map((session) => structuredClone(session));
    },
    async claimOwner(ownerToken, userId) {
      let count = 0;
      for (const session of state.sessions) {
        if (session.ownerToken === ownerToken && !session.userId) {
          session.userId = userId;
          count += 1;
        }
      }
      if (count > 0) await touch();
      return count;
    },
    async listOverrides() {
      return structuredClone(state.overrides);
    },
    async saveOverride(destination) {
      state.overrides = state.overrides.filter((item) => item.id !== destination.id);
      state.overrides.push(structuredClone(destination));
      await touch();
    },
    async listPromotions() {
      return structuredClone(state.promotions);
    },
    async savePromotion(promotion) {
      state.promotions = state.promotions.filter((item) => item.id !== promotion.id);
      state.promotions.push(structuredClone(promotion));
      await touch();
    },
    async listPartners() {
      return structuredClone(state.partners);
    },
    async savePartner(partner) {
      state.partners = state.partners.filter((item) => item.id !== partner.id);
      state.partners.push(structuredClone(partner));
      await touch();
    },
    async listAffiliates() {
      return structuredClone(state.affiliates);
    },
    async addReview(review) {
      state.reviews.push(structuredClone(review));
      await touch();
    },
    async hasReview(userId, destinationId) {
      return state.reviews.some((review) => review.userId === userId && review.destinationId === destinationId);
    },
    async listReviews(destinationId) {
      return state.reviews
        .filter((review) => review.destinationId === destinationId && review.status === "published")
        .map((review) => structuredClone(review));
    },
    async listVisited(userId) {
      return state.visited.filter((item) => item.userId === userId).map((item) => item.destinationId);
    },
    async markVisited(userId, destinationId, sessionId) {
      if (!state.visited.some((item) => item.userId === userId && item.destinationId === destinationId)) {
        state.visited.push({ userId, destinationId, sessionId });
        await touch();
      }
    },
    async addFavorite(userId, destinationId) {
      if (!state.favorites.some((item) => item.userId === userId && item.destinationId === destinationId)) {
        state.favorites.push({ userId, destinationId });
        await touch();
      }
    },
    async listFavorites(userId) {
      return state.favorites.filter((item) => item.userId === userId).map((item) => item.destinationId);
    },
    async addAnalytics(event) {
      state.analytics.push(structuredClone(event));
      await touch();
    },
    async saveQuality(rows) {
      state.quality.push(...structuredClone(rows));
      await touch();
    },
  };
}
