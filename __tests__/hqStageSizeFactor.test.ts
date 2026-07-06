import { hqStageSizeFactor, HQ_LAYOUT } from '../src/rendering/three/mapContentLayout';
import { hqSpriteSizeScale } from '../src/components/map/three/coc/cocPalette';

describe('hqStageSizeFactor', () => {
  it('starts at ring baseline (0.62) at stage 0', () => {
    expect(hqStageSizeFactor(0)).toBeCloseTo(HQ_LAYOUT.sizeFactorStart, 5);
    expect(HQ_LAYOUT.sizeFactorStart).toBe(0.62);
  });

  it('stays ring-sized through Townhouse (stage 15)', () => {
    expect(hqStageSizeFactor(15)).toBe(HQ_LAYOUT.sizeFactorStart);
    expect(hqStageSizeFactor(10)).toBe(HQ_LAYOUT.sizeFactorStart);
  });

  it('reaches 3 at Castle (stage 26)', () => {
    expect(hqStageSizeFactor(26)).toBe(HQ_LAYOUT.sizeFactorMax);
  });

  it('grows from Manor (16) onward', () => {
    expect(hqStageSizeFactor(16)).toBeGreaterThan(HQ_LAYOUT.sizeFactorStart);
    expect(hqStageSizeFactor(20)).toBeGreaterThan(hqStageSizeFactor(16));
  });

  it('grows monotonically from Manor to Castle', () => {
    let prev = hqStageSizeFactor(15);
    for (let s = 16; s <= 26; s++) {
      const next = hqStageSizeFactor(s);
      expect(next).toBeGreaterThanOrEqual(prev);
      prev = next;
    }
  });

  it('scales HQ sprite with gentle early art ramp, then grows from Manor', () => {
    const foundation = hqSpriteSizeScale(false, 0);
    const lowWall = hqSpriteSizeScale(false, 1);
    const gatedWall = hqSpriteSizeScale(false, 5);
    const townhouse = hqSpriteSizeScale(false, 15);
    const manor = hqSpriteSizeScale(false, 16);
    const castle = hqSpriteSizeScale(false, 26);
    expect(lowWall).toBeLessThan(foundation * 0.85);
    expect(townhouse).toBeGreaterThan(gatedWall);
    expect(manor).toBeGreaterThan(townhouse);
    expect(castle).toBeGreaterThan(manor);
  });
});
