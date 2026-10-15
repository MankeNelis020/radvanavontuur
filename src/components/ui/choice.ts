export function choiceClass(selected: boolean): string {
  return `touch-target rounded-full px-4 py-2 text-sm font-semibold ${
    selected ? "bg-forest-800 text-cream-50" : "border border-forest-800/15 bg-cream-100 text-ink"
  }`;
}

export const fieldClass =
  "mt-1 w-full rounded-input border border-cream-200 bg-cream-50 px-4 py-3 font-normal text-ink";
