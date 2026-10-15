export function formatAge(ageMonths: number, locale: "nl" | "en" = "nl"): string {
  const years = Math.floor(ageMonths / 12);
  if (locale === "en") {
    if (ageMonths < 24) return ageMonths === 1 ? "1 month" : `${ageMonths} months`;
    return years === 1 ? "1 year" : `${years} years`;
  }
  if (ageMonths < 24) {
    if (ageMonths === 1) return "1 maand";
    return `${ageMonths} maanden`;
  }
  if (years === 1) return "1 jaar";
  return `${years} jaar`;
}

export function ageUnit(ageMonths: number): "months" | "years" {
  return ageMonths < 24 ? "months" : "years";
}
