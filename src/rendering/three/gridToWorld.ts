import {
  BRICK_DEPTH,
  BRICK_GAP,
  BRICK_HEIGHT,
  BRICK_WIDTH,
  GROUND_DEPTH_FACTOR,
  GROUND_WIDTH_FACTOR,
  GRID_COLUMNS,
  SOIL_GRID_COLUMNS,
} from './constants';
import { SOIL_PAD_SCALE, WALL_LAYOUT, HQ_LAYOUT } from './mapContentLayout';

export interface WorldPosition {
  x: number;
  y: number;
  z: number;
  scaleX: number;
}

export function getGroundDimensions(plotScale = 1) {
  const width = GRID_COLUMNS * GROUND_WIDTH_FACTOR * plotScale;
  return {
    width,
    depth: width * GROUND_DEPTH_FACTOR,
  };
}

export function getSoilDimensions(plotScale = 1) {
  const { width: groundW } = getGroundDimensions(plotScale);
  const side = groundW * SOIL_PAD_SCALE;
  return { side, half: side / 2 };
}

/** Z of the inner green grass front edge (reference at hqDistanceFactor = 1). */
export function getWallGreenBorderZ(plotScale = 1): number {
  const { half } = getSoilDimensions(plotScale);
  const d = BRICK_DEPTH * plotScale;
  const gap = BRICK_GAP * plotScale;
  const offsetZ = WALL_LAYOUT.offsetZ * plotScale;
  if (WALL_LAYOUT.edge === 'front') {
    return half - gap - d / 2 + offsetZ;
  }
  return -half + gap + d / 2 + offsetZ;
}

/** @deprecated Use getWallGreenBorderZ — kept for overlay bounds. */
export function getWallWorldZ(plotScale = 1): number {
  return getWallGreenBorderZ(plotScale);
}

/** Wall row origin (gridX=0) — scaled from HQ toward green border by hqDistanceFactor. */
function getWallRowOrigin(
  plotScale: number,
  brickW: number,
  gap: number,
): { x: number; z: number } {
  const { half } = getSoilDimensions(plotScale);
  const borderZ = getWallGreenBorderZ(plotScale);
  const leftOnBorder = {
    x: -half + gap + brickW / 2 + WALL_LAYOUT.offsetX * plotScale,
    z: borderZ,
  };
  const hqX = HQ_LAYOUT.worldX * plotScale;
  const hqZ = HQ_LAYOUT.worldZ * plotScale;
  const t = WALL_LAYOUT.hqDistanceFactor;
  return {
    x: hqX + (leftOnBorder.x - hqX) * t,
    z: hqZ + (leftOnBorder.z - hqZ) * t,
  };
}

/**
 * Maps grid to 3D on the inner grass diamond.
 * gridX runs along world +X; gridY stacks courses upward.
 */
export function gridToWorldPosition(
  gridX: number,
  gridY: number,
  fractionalValue: number,
  plotScale = 1,
): WorldPosition {
  const w = BRICK_WIDTH * plotScale;
  const h = BRICK_HEIGHT * plotScale;
  const gap = BRICK_GAP * plotScale;

  const frac = fractionalValue >= 1 ? 1 : Math.max(0.15, fractionalValue);
  const cellW = w + gap;
  const brickW = w * frac;

  const origin = getWallRowOrigin(plotScale, brickW, gap);
  const x = origin.x + gridX * cellW;
  const z = origin.z;
  const y = 0.04 + gridY * (h + gap) + h / 2;

  return { x, y, z, scaleX: frac };
}

export function getWallHeightCourses(brickCount: number): number {
  return Math.max(1, Math.ceil(brickCount / SOIL_GRID_COLUMNS));
}

export { BRICK_WIDTH, BRICK_HEIGHT, BRICK_DEPTH };
