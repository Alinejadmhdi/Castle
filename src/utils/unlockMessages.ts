import type { UnlockEvent } from '@/types';

/** Human-readable unlock line with the cumulative brick threshold. */
export function formatUnlockMessage(unlock: UnlockEvent): string {
  const threshold = unlock.cumulativeBricks;
  const brickLabel =
    threshold === 1 ? '1 brick' : `${Number.isInteger(threshold) ? threshold : threshold.toFixed(1)} bricks`;
  return `${unlock.stageName} · ${brickLabel}`;
}

export function formatUnlockSummary(unlocks: UnlockEvent[]): string {
  if (unlocks.length === 0) return '';
  if (unlocks.length === 1) return formatUnlockMessage(unlocks[0]);
  return unlocks.map(formatUnlockMessage).join('\n');
}
