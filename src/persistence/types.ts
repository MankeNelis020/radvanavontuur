import type { CatalogDestination } from "@/data/catalog";
import type { SidePick } from "@/domain/itinerary";
import type { AffiliateOffer, PartnerRecord, PromotionRecord } from "@/domain/promotions/types";
import type { ResolvedPreferences } from "@/domain/preferences";
import type {
  EngineDestination,
  RespinReason,
  VisitStatus,
  WeatherSnapshot,
} from "@/domain/types";
import type { WheelSegment } from "@/domain/engine/wheel";

export type TravelView = {
  durationMinutes: number;
  source: "google_routes";
  fetchedAt: string;
};

export type SelectionRecord = {
  id: string;
  destination: EngineDestination;
  probability: number;
  explanation: string[];
  weather: WeatherSnapshot | null;
  hoursLabel: string;
  hoursStatus: "open" | "closed" | "unknown";
  distanceKm: number;
  travel: TravelView | null;
  wheel: WheelSegment[];
  kind: "primary" | "respin" | "replacement";
  promotion: PromotionRecord["id"] | null;
  createdAt: string;
};

export type StoredSession = {
  id: string;
  shareToken: string;
  ownerToken: string;
  userId: string | null;
  createdAt: string;
  preferences: Omit<ResolvedPreferences, "arrival"> & { arrival: string };
  status: VisitStatus;
  respinUsed: boolean;
  respinReason: RespinReason | null;
  respinNote: string | null;
  operationalReplacements: number;
  selections: SelectionRecord[];
  activeIndex: number;
  lunch: SidePick | null;
  returnStop: SidePick | null;
  favorite: boolean;
  seed: string;
  sources: {
    places: string;
    routes: string;
    weather: string;
    storage: string;
  };
};

export type ReviewRecord = {
  id: string;
  destinationId: string;
  userId: string;
  sessionId: string;
  rating: number;
  body: string;
  tags: string[];
  createdAt: string;
  status: "published" | "held";
};

export type AnalyticsRecord = {
  id: string;
  name: string;
  createdAt: string;
  sessionId: string | null;
  properties: Record<string, string | number | boolean | null>;
};

export type QualityRecord = {
  destinationId: string;
  fieldName: string;
  source: string;
  lastCheckedAt: string;
  confidence: string;
  issue: string;
  reviewStatus: string;
};

export type AppStore = {
  mode: "supabase" | "development-file";
  createSession(session: StoredSession): Promise<void>;
  getSession(id: string): Promise<StoredSession | null>;
  getByShareToken(token: string): Promise<StoredSession | null>;
  saveSession(session: StoredSession): Promise<void>;
  listByOwner(ownerToken: string): Promise<StoredSession[]>;
  listByUser(userId: string): Promise<StoredSession[]>;
  claimOwner(ownerToken: string, userId: string): Promise<number>;
  listOverrides(): Promise<CatalogDestination[]>;
  saveOverride(destination: CatalogDestination): Promise<void>;
  listPromotions(): Promise<PromotionRecord[]>;
  savePromotion(promotion: PromotionRecord): Promise<void>;
  listPartners(): Promise<PartnerRecord[]>;
  savePartner(partner: PartnerRecord): Promise<void>;
  listAffiliates(): Promise<AffiliateOffer[]>;
  addReview(review: ReviewRecord): Promise<void>;
  listReviews(destinationId: string): Promise<ReviewRecord[]>;
  hasReview(userId: string, destinationId: string): Promise<boolean>;
  listVisited(userId: string): Promise<string[]>;
  markVisited(userId: string, destinationId: string, sessionId: string): Promise<void>;
  addFavorite(userId: string, destinationId: string): Promise<void>;
  listFavorites(userId: string): Promise<string[]>;
  addAnalytics(event: AnalyticsRecord): Promise<void>;
  saveQuality(rows: QualityRecord[]): Promise<void>;
};
