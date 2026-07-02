import type { CategoryType } from '@/types';
import { MACRO_BUILDING_STAGES } from './buildings';
import { MINIATURE_BUILDING_STAGES } from './miniatureBuildings';

/** Miniature: keep monuments from Birdhouse (stage 3) onward. */
export const MINIATURE_MONUMENT_FROM_STAGE_INDEX = 3;

/** Standard: keep monuments from Hut (stage 9) onward — first structure after wall tiers. */
export const MACRO_MONUMENT_FROM_STAGE_INDEX = 9;

export function getMonumentStartStageIndex(categoryType: CategoryType): number {
  return categoryType === 'miniature'
    ? MINIATURE_MONUMENT_FROM_STAGE_INDEX
    : MACRO_MONUMENT_FROM_STAGE_INDEX;
}

/** Whether a completed stage unlock should spawn a permanent plot monument. */
export function shouldPersistStageMonument(
  categoryType: CategoryType,
  unlockedStageIndex: number,
): boolean {
  return unlockedStageIndex >= getMonumentStartStageIndex(categoryType);
}

export function shouldDisplayPlotMonument(
  categoryType: CategoryType,
  stageKey: string,
): boolean {
  const stages =
    categoryType === 'miniature' ? MINIATURE_BUILDING_STAGES : MACRO_BUILDING_STAGES;
  const stage = stages.find((s) => s.key === stageKey);
  if (!stage) return true;
  return stage.index >= getMonumentStartStageIndex(categoryType);
}
