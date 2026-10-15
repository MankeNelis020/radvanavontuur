export function formatAge(ageMonths: number): string {
  if (ageMonths < 24) {
    if (ageMonths === 1) return "1 maand";
    return `${ageMonths} maanden`;
  }
  const years = Math.floor(ageMonths / 12);
  if (years === 1) return "1 jaar";
  return `${years} jaar`;
}

export function ageUnit(ageMonths: number): "months" | "years" {
  return ageMonths < 24 ? "months" : "years";
}
