import type { BuildingStage } from '@/types';
import { MACRO_BUILDING_STAGES } from '@/constants/buildings';

export interface StageShapeConfig {
  stage: BuildingStage;
  width: number;
  depth: number;
  wallHeight: number;
  roofStyle: 'none' | 'flat' | 'lean' | 'peak' | 'mansion' | 'castle';
  towerCount: number;
  hasDoor: boolean;
  hasChimney: boolean;
  wallColor: string;
  roofColor: string;
}

function tierScale(index: number): number {
  return 1 + index * 0.08;
}

/** Visual recipe per macro stage (0–26). */
export function getStageShapeConfig(stageIndex: number): StageShapeConfig {
  const stage = MACRO_BUILDING_STAGES[stageIndex] ?? MACRO_BUILDING_STAGES[0];
  const t = tierScale(stageIndex);
  const idx = stage.index;

  let roofStyle: StageShapeConfig['roofStyle'] = 'none';
  if (idx >= 20) roofStyle = 'castle';
  else if (idx >= 15) roofStyle = 'mansion';
  else if (idx >= 8) roofStyle = 'peak';
  else if (idx === 7) roofStyle = 'lean';
  else if (idx >= 4) roofStyle = 'flat';

  return {
    stage,
    width: 2 * t,
    depth: 1.6 * t,
    wallHeight: 0.45 * (2 + Math.min(idx, 18) * 0.35),
    roofStyle,
    towerCount: idx >= 22 ? 4 : idx >= 20 ? 2 : 0,
    hasDoor: idx >= 4,
    hasChimney: idx >= 10 && idx < 20,
    wallColor: idx >= 20 ? '#9a9a9a' : idx >= 8 ? '#c4a574' : '#b8956a',
    roofColor: idx >= 20 ? '#5a5a5a' : '#6b4423',
  };
}

export function getStageByKey(stageKey: string): BuildingStage | undefined {
  return MACRO_BUILDING_STAGES.find((s) => s.key === stageKey);
}

export function getBrickLabelForStage(stageIndex: number): string {
  const stage = MACRO_BUILDING_STAGES[stageIndex];
  return `${stage.cumulativeBricks} bricks`;
}
