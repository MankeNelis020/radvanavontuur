export type WheelSegment = {
  id: string;
  label: string;
  weight: number;
  fraction: number;
  startDegrees: number;
  endDegrees: number;
};

export function buildWheelSegments(
  candidates: { id: string; label: string; weight: number }[],
  winnerId: string,
  maxSegments = 8,
): WheelSegment[] {
  const winner = candidates.find((candidate) => candidate.id === winnerId);
  if (!winner) {
    throw new Error("Het rad kan alleen een kandidaat tonen die echt geselecteerd is.");
  }
  const others = candidates
    .filter((candidate) => candidate.id !== winnerId)
    .sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))
    .slice(0, Math.max(0, maxSegments - 1));
  const visible = [winner, ...others].sort((a, b) => a.id.localeCompare(b.id));
  const total = visible.reduce((sum, segment) => sum + segment.weight, 0);
  let cursor = 0;
  return visible.map((segment) => {
    const fraction = segment.weight / total;
    const startDegrees = cursor * 360;
    cursor += fraction;
    return {
      id: segment.id,
      label: segment.label,
      weight: segment.weight,
      fraction,
      startDegrees,
      endDegrees: cursor * 360,
    };
  });
}

/** Draaiing in graden met de klok mee, zodat het midden van de winnaar bovenaan stopt. */
export function rotationForWinner(segments: WheelSegment[], winnerId: string, extraTurns: number): number {
  const winner = segments.find((segment) => segment.id === winnerId);
  if (!winner) throw new Error("Winnaar ontbreekt op het rad.");
  const mid = (winner.startDegrees + winner.endDegrees) / 2;
  return extraTurns * 360 - mid;
}
