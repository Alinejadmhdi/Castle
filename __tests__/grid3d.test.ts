import {
  getSoilDimensions,
  gridToWorldPosition,
  getWallHeightCourses,
} from '../src/rendering/three/gridToWorld';
import { WALL_LAYOUT } from '../src/rendering/three/mapContentLayout';
import { computeGridPosition } from '../src/features/progression/progressionService';
import { SOIL_GRID_COLUMNS, BRICK_DEPTH, BRICK_GAP } from '../src/rendering/three/constants';

describe('computeGridPosition wall grid', () => {
  it('places first brick at bottom-left (gridX=0, gridY=0)', () => {
    expect(computeGridPosition(0)).toEqual({ gridX: 0, gridY: 0 });
  });

  it('fills a row left to right then stacks upward', () => {
    expect(computeGridPosition(1)).toEqual({ gridX: 1, gridY: 0 });
    expect(computeGridPosition(SOIL_GRID_COLUMNS - 1)).toEqual({
      gridX: SOIL_GRID_COLUMNS - 1,
      gridY: 0,
    });
    expect(computeGridPosition(SOIL_GRID_COLUMNS)).toEqual({ gridX: 0, gridY: 1 });
  });
});

describe('gridToWorldPosition', () => {
  it('puts gridY=0 on the soil (y above dirt plane)', () => {
    const pos = gridToWorldPosition(0, 0, 1);
    expect(pos.y).toBeGreaterThan(0.04);
  });

  it('stacks second course higher', () => {
    const bottom = gridToWorldPosition(0, 0, 1);
    const second = gridToWorldPosition(0, 1, 1);
    expect(second.y).toBeGreaterThan(bottom.y);
  });

  it('spreads bricks along the front border on gridX', () => {
    const left = gridToWorldPosition(0, 0, 1);
    const right = gridToWorldPosition(1, 0, 1);
    expect(right.x).toBeGreaterThan(left.x);
    expect(right.z).toBe(left.z);
  });

  it('scales fractional bricks on X', () => {
    const pos = gridToWorldPosition(0, 0, 0.5);
    expect(pos.scaleX).toBe(0.5);
  });

  it('places bricks on the front edge of the green grass pad', () => {
    const { half: soilHalf } = getSoilDimensions(1);
    const pos = gridToWorldPosition(0, 0, 1);
    expect(Math.abs(pos.x)).toBeLessThanOrEqual(soilHalf);
    expect(pos.z).toBeGreaterThan(0);
    expect(pos.z).toBeLessThanOrEqual(soilHalf + 0.5);
    expect(pos.z).toBeCloseTo(
      soilHalf - BRICK_GAP - BRICK_DEPTH / 2 + WALL_LAYOUT.offsetZ,
      5,
    );
  });
});

describe('getWallHeightCourses', () => {
  it('returns at least 1 course', () => {
    expect(getWallHeightCourses(0)).toBe(1);
  });

  it('grows with row count', () => {
    expect(getWallHeightCourses(SOIL_GRID_COLUMNS + 1)).toBe(2);
  });
});
