import type { CategoryType } from '@/types';
import { MACRO_BUILDING_STAGES } from './buildings';
import { MINIATURE_BUILDING_STAGES } from './miniatureBuildings';

/** Hidden record — absorbs wall bricks when a stage completes (not shown on plot). */
export const CENTER_WALL_ABSORBER_KEY = 'center_absorber';

/** Permanent ring monuments from Garden Enclosure (stage 6) onward. */
export const MONUMENT_PERSIST_FROM_STAGE_INDEX = 6;

/** Stages 0–5 share one replaceable ring slot before stage 6. */
export const EARLY_REPLACE_MAX_STAGE_INDEX = 5;

/** @deprecated Use MONUMENT_PERSIST_FROM_STAGE_INDEX */
export const MINIATURE_MONUMENT_FROM_STAGE_INDEX = MONUMENT_PERSIST_FROM_STAGE_INDEX;

/** @deprecated Use MONUMENT_PERSIST_FROM_STAGE_INDEX */
export const MACRO_MONUMENT_FROM_STAGE_INDEX = MONUMENT_PERSIST_FROM_STAGE_INDEX;

export function getMonumentStartStageIndex(categoryType: CategoryType): number {
  return categoryType === 'miniature'
    ? MINIATURE_MONUMENT_FROM_STAGE_INDEX
    : MACRO_MONUMENT_FROM_STAGE_INDEX;
}

export function isEarlyReplaceMonumentStage(stageIndex: number): boolean {
  return stageIndex >= 0 && stageIndex <= EARLY_REPLACE_MAX_STAGE_INDEX;
}

/** Whether a completed stage unlock should spawn a permanent plot monument. */
export function shouldPersistStageMonument(
  _categoryType: CategoryType,
  unlockedStageIndex: number,
): boolean {
  return unlockedStageIndex >= MONUMENT_PERSIST_FROM_STAGE_INDEX;
}

export function shouldDisplayPlotMonument(
  categoryType: CategoryType,
  stageKey: string,
  currentStageIndex: number,
): boolean {
  if (stageKey === CENTER_WALL_ABSORBER_KEY) return false;
  const stages =
    categoryType === 'miniature' ? MINIATURE_BUILDING_STAGES : MACRO_BUILDING_STAGES;
  const stage = stages.find((s) => s.key === stageKey);
  if (!stage) return true;
  if (stage.index === currentStageIndex) return false;
  if (stage.index >= MONUMENT_PERSIST_FROM_STAGE_INDEX) return true;
  if (isEarlyReplaceMonumentStage(stage.index)) {
    return currentStageIndex <= EARLY_REPLACE_MAX_STAGE_INDEX;
  }
  return false;
}
