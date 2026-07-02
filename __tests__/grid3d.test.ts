import {
  getGroundDimensions,
  gridToWorldPosition,
  getWallHeightCourses,
} from '../src/rendering/three/gridToWorld';
import { computeGridPosition } from '../src/features/progression/progressionService';

describe('computeGridPosition bottom-up', () => {
  it('places first brick at bottom row (gridY=0)', () => {
    expect(computeGridPosition(1)).toEqual({ gridX: 0, gridY: 0 });
  });

  it('fills row left to right then stacks up', () => {
    expect(computeGridPosition(20)).toEqual({ gridX: 19, gridY: 0 });
    expect(computeGridPosition(21)).toEqual({ gridX: 0, gridY: 1 });
  });
});

describe('gridToWorldPosition', () => {
  it('puts gridY=0 on the ground (y = half brick height)', () => {
    const pos = gridToWorldPosition(0, 0, 1);
    expect(pos.y).toBeGreaterThan(0);
    expect(pos.y).toBeCloseTo(0.225, 2);
  });

  it('stacks second course higher', () => {
    const bottom = gridToWorldPosition(0, 0, 1);
    const second = gridToWorldPosition(0, 1, 1);
    expect(second.y).toBeGreaterThan(bottom.y);
  });

  it('scales fractional bricks on X', () => {
    const pos = gridToWorldPosition(0, 0, 0.5);
    expect(pos.scaleX).toBe(0.5);
  });

  it('anchors wall to the left edge of the ground', () => {
    const { width: groundW } = getGroundDimensions(1);
    const first = gridToWorldPosition(0, 0, 1);
    const second = gridToWorldPosition(1, 0, 1);
    expect(first.x).toBeLessThan(second.x);
    expect(first.x - 0.5).toBeGreaterThan(-groundW / 2);
  });

  it('places wall along the back edge of the ground (negative Z)', () => {
    const { depth: groundD } = getGroundDimensions(1);
    const pos = gridToWorldPosition(0, 0, 1);
    expect(pos.z).toBeLessThan(0);
    expect(pos.z).toBeGreaterThan(-groundD / 2);
  });
});

describe('getWallHeightCourses', () => {
  it('returns at least 1 course', () => {
    expect(getWallHeightCourses(0)).toBe(1);
  });
});
