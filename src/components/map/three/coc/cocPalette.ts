import { MAP_SKY_COLOR } from '@/rendering/three/constants';
import { HQ_LAYOUT, hqStageSizeFactor } from '@/rendering/three/mapContentLayout';
import { ringSpriteSizeScale } from '@/rendering/three/ringBuildingScale';
import { stageArtSizeFactor } from '@/rendering/three/stageArtScale';

/** Shared CoC palette — warm, saturated, no fog wash-out. */
export const COC_COLORS = {
  grass: '#5cb83a',
  grassDark: '#4aa52e',
  dirt: '#c9a66b',
  stone: '#9a9a9a',
  stoneLight: '#b8b8b8',
  stoneDark: '#6e6e6e',
  brick: '#c45c3a',
  brickDark: '#a04828',
  mortar: '#d4c4a8',
  wood: '#6b4423',
  woodDark: '#4a3020',
  woodLight: '#8b5a2b',
  thatch: '#d4a832',
  roofTile: '#c45c28',
  roofBlue: '#4a7ab8',
  roofYellow: '#d4a020',
  plaster: '#e8dcc8',
  water: '#4a9fd4',
  foliage: '#3d9e40',
  wilderness: MAP_SKY_COLOR,
  banner: '#c43030',
} as const;

/** Multiplier so HQ buildings fill the plot at CoC proportions. */
export const BUILDING_VISUAL_SCALE = 18;

/** Center HQ — fixed footprint regardless of stage or brick progress. */
export const HQ_FIXED_VISUAL_SCALE = 0.36;

/** Scattered ring monuments — smaller than HQ, outside the inner pad. */
export const RING_MONUMENT_VISUAL_SCALE = 0.34;

export function scaleSize(plotScale: number, miniature: boolean, value: number) {
  const mini = miniature ? 0.95 : 1;
  return value * plotScale * mini * BUILDING_VISUAL_SCALE;
}

/** Sprite billboard width factor — matches procedural building footprint. */
export const SPRITE_BASE_WIDTH = { standard: 9.5, miniature: 5.5 } as const;

/** @deprecated Use hqStageSizeFactor from mapContentLayout */
export function spriteStageGrowth(stageIndex: number): number {
  return hqStageSizeFactor(stageIndex) / HQ_LAYOUT.sizeFactorMax;
}

/** Scale multiplier for HQ sprite — gradient 0.8 → 3 by stage 16, then flat. */
export function hqSpriteSizeScale(miniature = false, stageIndex = 0): number {
  const footprint = HQ_FIXED_VISUAL_SCALE;
  const baseWidth = miniature ? SPRITE_BASE_WIDTH.miniature : SPRITE_BASE_WIDTH.standard;
  const base = (footprint * BUILDING_VISUAL_SCALE * 2.8) / baseWidth;
  return base * hqStageSizeFactor(stageIndex) * stageArtSizeFactor(stageIndex);
}

/** Scale multiplier for sprite buildings — HQ vs ring use separate size factors. */
export function spriteSizeScale(
  forRing: boolean,
  miniature = false,
  stageIndex = 0,
  currentHqStageIndex = 15,
): number {
  if (forRing) {
    return ringSpriteSizeScale(miniature, stageIndex, currentHqStageIndex);
  }
  return hqSpriteSizeScale(miniature, stageIndex);
}
