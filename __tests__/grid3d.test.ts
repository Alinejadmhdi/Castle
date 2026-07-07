import {
  getSoilDimensions,
  gridToWorldPosition,
  getWallHeightCourses,
  getWallGreenBorderZ,
} from '../src/rendering/three/gridToWorld';
import { HQ_LAYOUT, WALL_LAYOUT } from '../src/rendering/three/mapContentLayout';
import { computeGridPosition } from '../src/features/progression/progressionService';
import { SOIL_GRID_COLUMNS, BRICK_WIDTH, BRICK_GAP } from '../src/rendering/three/constants';

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

  it('spreads bricks along row step (Δx, Δz) per gridX', () => {
    const a = gridToWorldPosition(0, 0, 1);
    const b = gridToWorldPosition(1, 0, 1);
    const cellW = (BRICK_WIDTH + BRICK_GAP) * 1;
    expect(b.x - a.x).toBeCloseTo(cellW * WALL_LAYOUT.rowStepX, 5);
    expect(b.z - a.z).toBeCloseTo(WALL_LAYOUT.rowStepZ, 5);
  });

  it('scales fractional bricks on X', () => {
    const pos = gridToWorldPosition(0, 0, 0.5);
    expect(pos.scaleX).toBe(0.5);
  });

  it('places wall at hqDistanceFactor from HQ toward green border', () => {
    const borderZ = getWallGreenBorderZ(1);
    const mid = (SOIL_GRID_COLUMNS - 1) / 2;
    const a = gridToWorldPosition(Math.floor(mid) - 1, 0, 1);
    const b = gridToWorldPosition(Math.ceil(mid) + 1, 0, 1);
    const expectedZ =
      HQ_LAYOUT.worldZ +
      (borderZ - HQ_LAYOUT.worldZ) * WALL_LAYOUT.hqDistanceFactor +
      WALL_LAYOUT.nudgeZ;
    expect((a.z + b.z) / 2).toBeCloseTo(expectedZ, 5);
    expect(WALL_LAYOUT.hqDistanceFactor).toBe(2);
  });

  it('centers wall row on HQ worldX when centerOnHq is enabled', () => {
    const left = gridToWorldPosition(0, 0, 1);
    const right = gridToWorldPosition(SOIL_GRID_COLUMNS - 1, 0, 1);
    const centerX = (left.x + right.x) / 2;
    expect(centerX).toBeCloseTo(HQ_LAYOUT.worldX + WALL_LAYOUT.offsetX, 3);
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
