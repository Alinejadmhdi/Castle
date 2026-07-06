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
import { SOIL_PAD_SCALE, WALL_LAYOUT } from './mapContentLayout';

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

/** Front/back wall row on the painted map border (stone/grass edge, not inner soil pad). */
export function getWallWorldZ(plotScale = 1): number {
  const { width } = getGroundDimensions(plotScale);
  const borderHalf = width / 2;
  const d = BRICK_DEPTH * plotScale;
  const gap = BRICK_GAP * plotScale;
  const offsetZ = WALL_LAYOUT.offsetZ * plotScale;
  if (WALL_LAYOUT.edge === 'front') {
    return borderHalf - gap - d / 2 + offsetZ;
  }
  return -borderHalf + gap + d / 2 + offsetZ;
}

/**
 * Maps grid to 3D on the inner grass diamond.
 * gridX runs along the wall; gridY stacks courses upward.
 */
export function gridToWorldPosition(
  gridX: number,
  gridY: number,
  fractionalValue: number,
  plotScale = 1,
): WorldPosition {
  const w = BRICK_WIDTH * plotScale;
  const h = BRICK_HEIGHT * plotScale;
  const d = BRICK_DEPTH * plotScale;
  const gap = BRICK_GAP * plotScale;

  const frac = fractionalValue >= 1 ? 1 : Math.max(0.15, fractionalValue);
  const cellW = w + gap;
  const brickW = w * frac;

  const { half } = getSoilDimensions(plotScale);
  const originX = -half + gap + brickW / 2 + WALL_LAYOUT.offsetX * plotScale;

  const x = originX + gridX * cellW;
  const z = getWallWorldZ(plotScale);
  const y = 0.04 + gridY * (h + gap) + h / 2;

  return { x, y, z, scaleX: frac };
}

export function getWallHeightCourses(brickCount: number): number {
  return Math.max(1, Math.ceil(brickCount / SOIL_GRID_COLUMNS));
}

export { BRICK_WIDTH, BRICK_HEIGHT, BRICK_DEPTH };
