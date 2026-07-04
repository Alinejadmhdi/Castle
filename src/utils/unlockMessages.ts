import type { UnlockEvent, CategoryType } from '@/types';
import { getCheckpointProgress } from '@/features/progression/checkpointProgress';
import { detectCategoryTheme } from '@/features/motivation/categoryTheme';
import { getMilestoneMessage } from '@/features/motivation/stageMilestones';

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

/** Real-world progression context shown in the achievement popup. */
export function formatUnlockProgression(
  unlock: UnlockEvent,
  categoryType: CategoryType,
  categoryName?: string,
): string {
  const total = unlock.categoryBrickTotal;
  const isMiniature = categoryType === 'miniature';
  const theme = detectCategoryTheme(categoryName ?? unlock.stageName, isMiniature);
  const milestone = getMilestoneMessage(theme, Math.max(total, 1));
  const checkpoint = getCheckpointProgress(total, categoryType);
  const label = categoryName ? `"${categoryName}"` : 'this category';
  const unit = isMiniature ? 'resists' : 'focus hours';

  if (checkpoint.remaining > 0) {
    return `With ${Math.floor(total)} ${unit} on ${label}, ${milestone} Next up: ${checkpoint.hint}.`;
  }
  return `With ${Math.floor(total)} ${unit} on ${label}, ${milestone}`;
}
