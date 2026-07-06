import { hqSpriteSizeScale } from '../src/components/map/three/coc/cocPalette';
import { HQ_LAYOUT } from '../src/rendering/three/ringBuildingScale';
import {
  ringHqProgressShrink,
  ringMonumentTierFactor,
  ringSpriteSizeMatchesHq,
  ringSpriteSizeScale,
} from '../src/rendering/three/ringBuildingScale';

describe('ringBuildingScale', () => {
  it('groups stages 0–5 at the same tier (matches HQ at that stage)', () => {
    expect(ringMonumentTierFactor(0)).toBe(ringMonumentTierFactor(5));
    expect(ringMonumentTierFactor(0)).toBe(1);
  });

  it('groups stages 6–8 above 0–5', () => {
    expect(ringMonumentTierFactor(6)).toBe(ringMonumentTierFactor(8));
    expect(ringMonumentTierFactor(6)).toBeGreaterThan(ringMonumentTierFactor(5));
  });

  it('gives stage 9 its own tier above 6–8', () => {
    expect(ringMonumentTierFactor(9)).toBeGreaterThan(ringMonumentTierFactor(8));
  });

  it('groups stages 10–15 at the largest tier before HQ shrink', () => {
    expect(ringMonumentTierFactor(10)).toBe(ringMonumentTierFactor(15));
    expect(ringMonumentTierFactor(15)).toBeGreaterThan(ringMonumentTierFactor(9));
  });

  it('steps down each stage from 16 onward', () => {
    expect(ringMonumentTierFactor(17)).toBeLessThan(ringMonumentTierFactor(16));
    expect(ringMonumentTierFactor(26)).toBeLessThan(ringMonumentTierFactor(16));
  });

  it('does not shrink rings until HQ stage 16', () => {
    expect(ringHqProgressShrink(15)).toBe(1);
    expect(ringHqProgressShrink(16)).toBeLessThan(1);
    expect(ringHqProgressShrink(26)).toBeLessThan(ringHqProgressShrink(16));
  });

  it('matches HQ size for same-stage early wall monuments', () => {
    expect(ringSpriteSizeMatchesHq(false, 1, 1)).toBe(true);
  });

  it('freezes ring size at monument stage — smaller than current HQ when advanced', () => {
    const hq = hqSpriteSizeScale(false, 16);
    const ring = ringSpriteSizeScale(false, 8, 16);
    expect(ring).toBeLessThan(hq);
  });

  it('shrinks ring sprites relative to HQ as HQ stage rises past 15', () => {
    const beforeManor = ringSpriteSizeScale(false, 12, 15);
    const atManor = ringSpriteSizeScale(false, 12, 16);
    const late = ringSpriteSizeScale(false, 12, 26);
    expect(atManor).toBeLessThan(beforeManor);
    expect(late).toBeLessThan(atManor);
  });

  it('keeps later monument stages smaller at the same HQ stage', () => {
    const mid = ringSpriteSizeScale(false, 16, 22);
    const late = ringSpriteSizeScale(false, 20, 22);
    expect(late).toBeLessThan(mid);
  });

  it('shares HQ exponential start with ring baseline', () => {
    expect(HQ_LAYOUT.sizeFactorStart).toBe(0.62);
    const ringAtFoundation = ringSpriteSizeScale(false, 0, 0);
    const hqAtFoundation = hqSpriteSizeScale(false, 0);
    expect(ringAtFoundation).toBeCloseTo(hqAtFoundation, 5);
  });
});
