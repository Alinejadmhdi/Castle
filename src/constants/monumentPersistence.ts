import type { CategoryType } from '@/types';
import { MACRO_BUILDING_STAGES } from './buildings';
import { MINIATURE_BUILDING_STAGES } from './miniatureBuildings';

/** Hidden record — absorbs wall bricks when a stage completes (not shown on plot). */
export const CENTER_WALL_ABSORBER_KEY = 'center_absorber';

/** Miniature: same monument threshold as standard — Hut (stage 9) onward. */
export const MINIATURE_MONUMENT_FROM_STAGE_INDEX = 9;

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
  if (stageKey === CENTER_WALL_ABSORBER_KEY) return false;
  const stages =
    categoryType === 'miniature' ? MINIATURE_BUILDING_STAGES : MACRO_BUILDING_STAGES;
  const stage = stages.find((s) => s.key === stageKey);
  if (!stage) return true;
  return stage.index >= getMonumentStartStageIndex(categoryType);
}
