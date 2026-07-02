import type { CategoryType } from '@/types';
import {
  getMacroStageForBrickValue,
  getPositionInStage,
  MACRO_BUILDING_STAGES,
} from '@/constants/buildings';
import { MINIATURE_BUILDING_STAGES } from '@/constants/miniatureBuildings';
import { BRICK_HEIGHT } from '@/rendering/three/constants';
import { getGroundDimensions } from '@/rendering/three/gridToWorld';

export interface BuildingVisualParams {
  stageKey: string;
  stageName: string;
  stageIndex: number;
  progress: number;
  wallHeight: number;
  width: number;
  depth: number;
  hasRoof: boolean;
  hasPeakRoof: boolean;
  hasChimney: boolean;
  isEnclosure: boolean;
}

export function getBuildingVisualParams(
  brickValue: number,
  categoryType: CategoryType,
  plotScale = 1,
): BuildingVisualParams {
  const stages = categoryType === 'miniature' ? MINIATURE_BUILDING_STAGES : MACRO_BUILDING_STAGES;
  const stage =
    categoryType === 'miniature'
      ? stages.find((s, i) => {
          const next = stages[i + 1];
          return brickValue >= s.cumulativeBricks && (!next || brickValue < next.cumulativeBricks);
        }) ?? stages[0]
      : getMacroStageForBrickValue(brickValue);

  const positionInStage =
    categoryType === 'miniature'
      ? brickValue - (stages[stage.index - 1]?.cumulativeBricks ?? 0)
      : getPositionInStage(brickValue, stage);
  const progress = Math.min(1, Math.max(0, positionInStage / Math.max(1, stage.stageBrickCount)));

  const idx = stage.index;
  const scale = categoryType === 'miniature' ? plotScale * 0.85 : plotScale;

  const minWallCourses = 1 + Math.floor(progress * 4);
  const stageWallBoost = Math.min(idx, 12) * 0.35;
  const wallHeight = BRICK_HEIGHT * scale * (minWallCourses + stageWallBoost);

  const width = scale * (2.2 + idx * 0.15 + progress * 0.4);
  const depth = scale * (1.8 + idx * 0.1 + progress * 0.3);

  const isEnclosure = idx >= 4;
  const hasRoof = idx >= 7;
  const hasPeakRoof = idx >= 8;
  const hasChimney = idx >= 10;

  return {
    stageKey: stage.key,
    stageName: stage.name,
    stageIndex: idx,
    progress,
    wallHeight,
    width,
    depth,
    hasRoof,
    hasPeakRoof,
    hasChimney,
    isEnclosure,
  };
}

export function getBuildingWorldAnchor(plotScale = 1) {
  const { width: groundW, depth: groundD } = getGroundDimensions(plotScale);
  return {
    x: 0,
    z: 0,
    groundW,
    groundD,
    inset: 0.12 * plotScale,
  };
}
