import {
  MACRO_BUILDING_STAGES,
  getMacroStageForBrickValue,
  getPositionInStage,
  isNewStageUnlocked,
} from '@/constants/buildings';
import { getCompoundRuleForStageGap } from '@/constants/compoundBuildings';
import { getDailyStructureForBrickValue } from '@/constants/dailyBuildings';
import { MINIATURE_BUILDING_STAGES } from '@/constants/miniatureBuildings';
import { GRID_COLUMNS } from '@/rendering/three/constants';
import type {
  Brick,
  BuildingInstance,
  BuildingStage,
  CategoryType,
  CompoundRule,
  DailyBuildingTier,
} from '@/types';

export interface CompoundProgress {
  rule: CompoundRule;
  completedSubCount: number;
  completedCompoundCount: number;
  subsNeededForNextCompound: number;
}

export function getStagesForCategoryType(type: CategoryType): BuildingStage[] {
  return type === 'miniature' ? MINIATURE_BUILDING_STAGES : MACRO_BUILDING_STAGES;
}

export function getStageForBrickValue(
  brickValue: number,
  type: CategoryType = 'standard',
): BuildingStage {
  const stages = getStagesForCategoryType(type);
  let stage = stages[0];
  for (const s of stages) {
    if (brickValue >= s.cumulativeBricks) {
      stage = s;
    } else {
      break;
    }
  }
  return stage;
}

export function getDailyStructure(brickValueToday: number): DailyBuildingTier | null {
  return getDailyStructureForBrickValue(brickValueToday);
}

export function shouldUseCompoundFill(stage: BuildingStage): boolean {
  return stage.stageBrickCount >= 80 && stage.usesCompoundFill;
}

export function getCompoundProgress(
  subBuildingsCompleted: number,
  stageBrickCount: number,
): CompoundProgress {
  const rule = getCompoundRuleForStageGap(stageBrickCount);
  const completedCompoundCount = Math.floor(subBuildingsCompleted / rule.combineCount);
  const completedSubCount = subBuildingsCompleted % rule.combineCount;
  return {
    rule,
    completedSubCount,
    completedCompoundCount,
    subsNeededForNextCompound: rule.combineCount - completedSubCount,
  };
}

export function checkMacroStageUnlock(
  previousValue: number,
  newValue: number,
  categoryType: CategoryType = 'standard',
): BuildingStage | null {
  return isNewStageUnlocked(previousValue, newValue, categoryType);
}

export function allocateBrickToStage(
  brickValue: number,
  type: CategoryType = 'standard',
): { stage: BuildingStage; positionInStage: number } {
  const stage = getStageForBrickValue(brickValue, type);
  const stages = getStagesForCategoryType(type);
  const prev = stages[stage.index - 1];
  const base = prev ? prev.cumulativeBricks : 0;
  return {
    stage,
    positionInStage: brickValue - base,
  };
}

/**
 * Grid position for brick placement.
 * gridY=0 is the bottom course; bricks stack upward (ground → sky).
 */
export function computeGridPosition(
  globalIndex: number,
  columns = GRID_COLUMNS,
): { gridX: number; gridY: number } {
  const index = globalIndex - 1;
  return {
    gridX: index % columns,
    gridY: Math.floor(index / columns),
  };
}

export function createBuildingInstance(
  partial: Omit<BuildingInstance, 'id' | 'unlockedAt'> & { id?: string },
): BuildingInstance {
  return {
    ...partial,
    id: partial.id ?? `building-${Date.now()}`,
    unlockedAt: new Date().toISOString(),
    sourceInstanceIds: partial.sourceInstanceIds ?? [],
  };
}

export function bricksFillStage(bricks: Brick[], stageIndex: number): boolean {
  const stage = MACRO_BUILDING_STAGES[stageIndex];
  if (!stage) return false;
  const prev = MACRO_BUILDING_STAGES[stageIndex - 1];
  const base = prev ? prev.cumulativeBricks : 0;
  const inStage = bricks.filter(
    (b) => b.stageIndex === stageIndex || b.globalIndex > base,
  );
  const value = inStage.reduce((sum, b) => sum + b.fractionalValue, 0);
  return value >= stage.stageBrickCount;
}

/**
 * Wall bricks for the current in-progress stage only.
 * Completed stages are absorbed into the center building on upgrade.
 */
export function getVisibleWallBricks(
  bricks: Brick[],
  totalBrickValue: number,
  categoryType: CategoryType = 'standard',
): Brick[] {
  if (totalBrickValue <= 0) return [];
  const currentStage = getStageForBrickValue(totalBrickValue, categoryType);
  return bricks.filter(
    (b) => b.stageIndex === currentStage.index && b.buildingInstanceId == null,
  );
}

export { getMacroStageForBrickValue, getPositionInStage };
