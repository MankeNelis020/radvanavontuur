/**
 * Uniform independent selection.
 *
 * Commercial partnerships must never influence this function.
 * It accepts a count and a random source only — no weights, sponsors, or preferences.
 * A future recommendation engine should replace this module, not the wheel UI.
 */
export function selectIndex(count: number, random: () => number = Math.random): number {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("count must be a positive integer");
  }
  const value = random();
  if (value < 0 || value >= 1) {
    throw new Error("random() must return a value in [0, 1)");
  }
  return Math.floor(value * count);
}
