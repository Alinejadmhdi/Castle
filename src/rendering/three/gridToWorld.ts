import {
  BRICK_DEPTH,
  BRICK_GAP,
  BRICK_HEIGHT,
  BRICK_WIDTH,
  GROUND_DEPTH_FACTOR,
  GROUND_WIDTH_FACTOR,
  GRID_COLUMNS,
  SOIL_GRID_COLUMNS,
  SOIL_PAD_FRACTION,
} from './constants';

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
  const side = groundW * SOIL_PAD_FRACTION;
  return { side, half: side / 2 };
}

/**
 * Maps grid to 3D on the back-left corner of the soil pad.
 * gridX runs along the back border; gridY stacks courses upward.
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
  const originX = -half + gap + brickW / 2;
  const x = originX + gridX * cellW;
  const z = -half + gap + d / 2;
  const y = 0.04 + gridY * (h + gap) + h / 2;

  return { x, y, z, scaleX: frac };
}

export function getWallHeightCourses(brickCount: number): number {
  return Math.max(1, Math.ceil(brickCount / SOIL_GRID_COLUMNS));
}

export { BRICK_WIDTH, BRICK_HEIGHT, BRICK_DEPTH };
