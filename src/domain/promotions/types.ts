export type PartnerRecord = {
  id: string;
  destinationId: string;
  organizationName: string;
  contactName: string;
  contactEmail: string;
  agreementStatus: "concept" | "active" | "ended";
  startDate: string;
  endDate: string | null;
  notes: string;
};

export type PromotionRecord = {
  id: string;
  destinationId: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed" | "perk";
  discountValue: number | null;
  code: string | null;
  startDate: string;
  endDate: string;
  terms: string;
  active: boolean;
  redemptionUrl: string | null;
};

export type AffiliateOffer = {
  id: string;
  destinationId: string;
  label: string;
  url: string;
  provider: string;
};

export type PromotionView = {
  id: string;
  title: string;
  description: string;
  terms: string;
  validUntil: string;
  code: string | null;
  redemptionUrl: string | null;
};
