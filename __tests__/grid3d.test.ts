import {
  getSoilDimensions,
  gridToWorldPosition,
  getWallHeightCourses,
  getWallGreenBorderZ,
} from '../src/rendering/three/gridToWorld';
import { HQ_LAYOUT, WALL_LAYOUT } from '../src/rendering/three/mapContentLayout';
import { computeGridPosition } from '../src/features/progression/progressionService';
import { SOIL_GRID_COLUMNS } from '../src/rendering/three/constants';

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

  it('spreads bricks along +X at a fixed Z row', () => {
    const left = gridToWorldPosition(0, 0, 1);
    const right = gridToWorldPosition(1, 0, 1);
    expect(right.x - left.x).toBeGreaterThan(0.5);
    expect(right.z).toBeCloseTo(left.z, 5);
  });

  it('scales fractional bricks on X', () => {
    const pos = gridToWorldPosition(0, 0, 0.5);
    expect(pos.scaleX).toBe(0.5);
  });

  it('places wall at hqDistanceFactor from HQ toward green border', () => {
    const borderZ = getWallGreenBorderZ(1);
    const pos = gridToWorldPosition(0, 0, 1);
    const expectedZ =
      HQ_LAYOUT.worldZ +
      (borderZ - HQ_LAYOUT.worldZ) * WALL_LAYOUT.hqDistanceFactor;
    expect(pos.z).toBeCloseTo(expectedZ, 5);
    expect(WALL_LAYOUT.hqDistanceFactor).toBe(2);
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
