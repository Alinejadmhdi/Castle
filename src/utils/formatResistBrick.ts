import type { Brick } from '@/types';
import { formatBrickValue } from '@/utils';

export function formatResistBrickSummary(brick: Brick): string {
  const date = new Date(brick.completedAt).toLocaleDateString();
  const time = new Date(brick.completedAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${date} · ${time} · brick #${brick.globalIndex} (${formatBrickValue(brick.fractionalValue)} hr)`;
}
