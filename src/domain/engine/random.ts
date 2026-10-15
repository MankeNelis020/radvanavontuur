/** Mulberry32. Zelfde seed geeft dezelfde reeks. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function rngFromSeed(seed: string): () => number {
  return mulberry32(hashSeed(seed));
}

export function weightedIndex(weights: number[], rng: () => number): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) {
    throw new Error("Selectie zonder positief gewicht is niet mogelijk.");
  }
  let cursor = rng() * total;
  for (let index = 0; index < weights.length; index += 1) {
    cursor -= weights[index] ?? 0;
    if (cursor <= 0) return index;
  }
  return weights.length - 1;
}
