export const segments = ["forest", "coast", "mountains", "city", "museum", "nearby"] as const;
export type SegmentId = (typeof segments)[number];

export const preferences = ["outdoors", "culture", "food", "water", "city", "quiet"] as const;
export type PreferenceId = (typeof preferences)[number];

export type SpinMode = "quick" | "extended";

export type SpinRecord = {
  segment: SegmentId;
  mode: SpinMode;
  distanceKm: number;
  ages: number[];
  preferences: PreferenceId[];
};

export function isSegment(value: unknown): value is SegmentId {
  return typeof value === "string" && (segments as readonly string[]).includes(value);
}

export function isPreference(value: unknown): value is PreferenceId {
  return typeof value === "string" && (preferences as readonly string[]).includes(value);
}
