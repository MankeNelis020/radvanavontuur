import { isPreference, isSegment, type SpinRecord } from "./types";

const SPIN_KEY = "wondaro.spin";
const EMAIL_KEY = "wondaro.device-email";

export function parseSpin(raw: string): SpinRecord | null {
  try {
    const data = JSON.parse(raw) as Partial<SpinRecord>;
    if (!data || typeof data !== "object") return null;
    if (!isSegment(data.segment)) return null;
    if (data.mode !== "quick" && data.mode !== "extended") return null;
    if (typeof data.distanceKm !== "number" || Number.isNaN(data.distanceKm)) return null;
    if (!Array.isArray(data.ages) || data.ages.length === 0) return null;
    if (data.ages.some((age) => typeof age !== "number" || Number.isNaN(age))) return null;
    if (!Array.isArray(data.preferences)) return null;
    if (data.preferences.some((item) => !isPreference(item))) return null;
    return {
      segment: data.segment,
      mode: data.mode,
      distanceKm: data.distanceKm,
      ages: data.ages,
      preferences: data.preferences,
    };
  } catch {
    return null;
  }
}

export function saveSpin(record: SpinRecord) {
  sessionStorage.setItem(SPIN_KEY, JSON.stringify(record));
}

export function readSpin(): SpinRecord | null {
  try {
    const raw = sessionStorage.getItem(SPIN_KEY);
    if (!raw) return null;
    return parseSpin(raw);
  } catch {
    return null;
  }
}

export function saveDeviceEmail(email: string) {
  localStorage.setItem(EMAIL_KEY, email);
}

export function readDeviceEmail(): string {
  try {
    return localStorage.getItem(EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function forgetDeviceEmail() {
  localStorage.removeItem(EMAIL_KEY);
}
