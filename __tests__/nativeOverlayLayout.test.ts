import { hqOverlayLayout } from '../src/rendering/three/plotOverlayLayout';
import { brickOverlayLayout } from '../src/rendering/three/plotOverlayLayout';
import type { Brick } from '../src/types';

describe('native overlay layout', () => {
  it('hq image has on-screen size', () => {
    const style = hqOverlayLayout(1, 2, 'miniature');
    const width = parseFloat(String(style.width));
    expect(width).toBeGreaterThan(8);
    expect(style.aspectRatio).toBe(0.94);
  });

  it('brick container has explicit height', () => {
    const brick: Brick = {
      id: 'b1',
      categoryId: 'c1',
      color: '#c45c3a',
      sessionId: null,
      fractionalValue: 1,
      globalIndex: 1,
      stageIndex: 2,
      positionInStage: 1,
      dailyBuildId: null,
      buildingInstanceId: null,
      gridX: 0,
      gridY: 0,
      streakRewardLabel: null,
      completedAt: '',
      isMiniature: true,
    };
    const layout = brickOverlayLayout(brick, 1);
    expect(layout.container.height).toBeDefined();
    const h = parseFloat(String(layout.container.height));
    expect(h).toBeGreaterThan(1);
  });
});
