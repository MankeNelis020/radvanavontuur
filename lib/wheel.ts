/**
 * Rotation, in degrees, that brings `index` to the top pointer after a clockwise spin.
 * Segment 0 is drawn centered at 12 o'clock. Positive CSS rotation is clockwise.
 */
export function rotationForSegment(
  index: number,
  current: number,
  segmentCount = 6,
  extraTurns = 5,
): number {
  const slice = 360 / segmentCount;
  const normalized = ((index % segmentCount) + segmentCount) % segmentCount;
  const targetMod = (360 - normalized * slice) % 360;
  const turns = Math.ceil(current / 360);
  let next = (turns + extraTurns) * 360 + targetMod;
  if (next <= current) next += 360;
  return next;
}
