import type { CategoryType } from '@/types';
import { getStageForBrickValue, getStagesForCategoryType } from './progressionService';

export interface CheckpointProgress {
  /** Total bricks/hours logged. */
  current: number;
  /** Cumulative bricks needed for the next building stage. */
  target: number;
  /** Bricks still needed for the next building. */
  remaining: number;
  nextStageName: string;
  currentStageName: string;
  /** e.g. "15/24" */
  label: string;
  /** e.g. "9 more until Knee Wall" */
  hint: string;
}

export function getCheckpointProgress(
  totalBrickValue: number,
  categoryType: CategoryType = 'standard',
): CheckpointProgress {
  const stages = getStagesForCategoryType(categoryType);
  const currentStage = getStageForBrickValue(totalBrickValue, categoryType);
  const nextStage = stages[currentStage.index + 1];
  const current = Math.floor(totalBrickValue);
  const target = nextStage?.cumulativeBricks ?? currentStage.cumulativeBricks;
  const remaining = Math.max(0, target - current);
  const nextStageName = nextStage?.name ?? currentStage.name;

  const hint =
    remaining > 0
      ? `${remaining} more until ${nextStageName}`
      : `Reached ${currentStage.name}`;

  return {
    current,
    target,
    remaining,
    nextStageName,
    currentStageName: currentStage.name,
    label: `${current}/${target}`,
    hint,
  };
}
