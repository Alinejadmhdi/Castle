import { hqSpriteSizeScale } from '../src/components/map/three/coc/cocPalette';
import { stageArtSizeFactor } from '../src/rendering/three/stageArtScale';

describe('stageArtSizeFactor', () => {
  it('keeps foundation smaller than the old baseline', () => {
    expect(stageArtSizeFactor(0)).toBe(0.72);
  });

  it('shrinks low_wall art so it is closer to foundation than equal scale', () => {
    const foundation = hqSpriteSizeScale(false, 0);
    const lowWall = hqSpriteSizeScale(false, 1);
    expect(lowWall).toBeLessThan(foundation * 0.85);
    expect(lowWall).toBeGreaterThan(foundation * 0.65);
  });

  it('ramps early wall stages gently toward baseline', () => {
    expect(stageArtSizeFactor(2)).toBeGreaterThan(stageArtSizeFactor(1));
    expect(stageArtSizeFactor(5)).toBeGreaterThan(stageArtSizeFactor(2));
    expect(stageArtSizeFactor(15)).toBe(1);
  });
});
