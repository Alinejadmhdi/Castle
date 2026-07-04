import type { BuildingStage, CategoryType } from '@/types';
import { COMPOUND_STAGE_THRESHOLD } from './compoundBuildings';
import { MACRO_BUILDING_STAGES } from './buildingStages';

export { MACRO_BUILDING_STAGES };

export { COMPOUND_STAGE_THRESHOLD };

export function getMacroStageForBrickValue(brickValue: number): BuildingStage {
  let stage = MACRO_BUILDING_STAGES[0];
  for (const s of MACRO_BUILDING_STAGES) {
    if (brickValue >= s.cumulativeBricks) {
      stage = s;
    } else {
      break;
    }
  }
  return stage;
}

export function getPositionInStage(brickValue: number, stage: BuildingStage): number {
  const prev = MACRO_BUILDING_STAGES[stage.index - 1];
  const base = prev ? prev.cumulativeBricks : 0;
  return brickValue - base;
}

export function getStageForCategoryBrickValue(
  brickValue: number,
  _categoryType: CategoryType = 'standard',
): BuildingStage {
  return getMacroStageForBrickValue(brickValue);
}

export function isNewStageUnlocked(
  previousValue: number,
  newValue: number,
  categoryType: CategoryType = 'standard',
): BuildingStage | null {
  const prevStage = getStageForCategoryBrickValue(previousValue, categoryType);
  const newStage = getStageForCategoryBrickValue(newValue, categoryType);
  if (newStage.index > prevStage.index) {
    return newStage;
  }
  return null;
}
