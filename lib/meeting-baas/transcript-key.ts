/** Stable provider key shared by live finals and the final artifact import. */
export function providerSegmentKey(botId: string, startTime: number | null): string | null {
  if (startTime === null || !Number.isFinite(startTime)) return null;
  return `${botId}:${Math.round(startTime * 1000)}`;
}
