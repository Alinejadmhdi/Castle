import { brickOverlayLayout } from '../src/rendering/three/plotOverlayLayout';
import type { Brick } from '../src/types';

function sampleBrick(gridX: number, gridY: number): Brick {
  return {
    id: 'b1',
    categoryId: 'c1',
    color: '#c45c3a',
    sessionId: null,
    fractionalValue: 1,
    globalIndex: 1,
    stageIndex: 0,
    positionInStage: 1,
    dailyBuildId: null,
    buildingInstanceId: null,
    gridX,
    gridY,
    streakRewardLabel: null,
    completedAt: '',
    isMiniature: true,
  };
}

describe('brickOverlayLayout size', () => {
  it('places first brick on-screen with readable size', () => {
    const layout = brickOverlayLayout(sampleBrick(0, 0), 1);
    const left = parseFloat(String(layout.container.left));
    const top = parseFloat(String(layout.container.top));
    const width = parseFloat(String(layout.container.width));
    const frontH = parseFloat(String(layout.frontHeightPct));

    expect(left).toBeGreaterThan(5);
    expect(left).toBeLessThan(95);
    expect(top).toBeGreaterThan(5);
    expect(top).toBeLessThan(95);
    expect(width).toBeGreaterThan(6);
    expect(frontH).toBeGreaterThan(1.5);
  });
});
