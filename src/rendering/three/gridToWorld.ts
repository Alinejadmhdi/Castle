import {
  BRICK_DEPTH,
  BRICK_GAP,
  BRICK_HEIGHT,
  BRICK_WIDTH,
  GROUND_DEPTH_FACTOR,
  GROUND_WIDTH_FACTOR,
  GRID_COLUMNS,
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

/**
 * Maps grid to 3D world coords.
 * - gridY=0 is the bottom course; bricks stack upward.
 * - gridX=0 starts at the left edge of the ground (fills left → right).
 * - Wall sits along the near edge of the plot (bottom of the map view).
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

  const { width: groundW, depth: groundD } = getGroundDimensions(plotScale);
  const inset = gap;

  const wallLeft = -groundW / 2 + inset;
  const x = wallLeft + gridX * cellW + brickW / 2;
  const y = gridY * (h + gap) + h / 2;
  const z = -groundD / 2 + inset + d / 2;

  return { x, y, z, scaleX: frac };
}

export function getWallHeightCourses(brickCount: number): number {
  return Math.max(1, Math.ceil(brickCount / GRID_COLUMNS));
}

export { BRICK_WIDTH, BRICK_HEIGHT, BRICK_DEPTH };
