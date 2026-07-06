import { hqSpriteSizeScale } from '@/components/map/three/coc/cocPalette';
import { HQ_LAYOUT } from '@/rendering/three/mapContentLayout';

/**
 * Ring monument size — frozen at the monument's own stage scale, with tier bumps
 * and late-game shrink vs the growing HQ.
 */

/** Relative to the monument's stage HQ scale (=1.0 for early wall tiers). */
const RING_TIER = {
  earlyWallMax: 5,
  /** Stages 0–5 — same scale the stage had as HQ when built. */
  earlyWallFactor: 1,
  gardenMax: 8,
  gardenFactor: 1.06,
  hutFactor: 1.1,
  midHouseMax: 15,
  midHouseFactor: 1.14,
  latePeakFactor: 1.14,
  latePerStageDrop: 0.022,
  lateMinFactor: 0.58,
} as const;

const HQ_SHRINK = {
  startAt: 16,
  endAt: 26,
  minFactor: 0.48,
} as const;

export function ringMonumentTierFactor(monumentStageIndex: number): number {
  const s = Math.min(26, Math.max(0, monumentStageIndex));
  if (s <= RING_TIER.earlyWallMax) return RING_TIER.earlyWallFactor;
  if (s <= RING_TIER.gardenMax) return RING_TIER.gardenFactor;
  if (s === 9) return RING_TIER.hutFactor;
  if (s <= RING_TIER.midHouseMax) return RING_TIER.midHouseFactor;
  const steps = s - RING_TIER.midHouseMax;
  return Math.max(
    RING_TIER.lateMinFactor,
    RING_TIER.latePeakFactor - steps * RING_TIER.latePerStageDrop,
  );
}

export function ringHqProgressShrink(currentHqStageIndex: number): number {
  const lastFullSizeStage = HQ_SHRINK.startAt - 1;
  if (currentHqStageIndex <= lastFullSizeStage) return 1;
  const span = HQ_SHRINK.endAt - lastFullSizeStage;
  const t = Math.min(1, (currentHqStageIndex - lastFullSizeStage) / span);
  return 1 - t * (1 - HQ_SHRINK.minFactor);
}

/** Ring monuments stay ring-sized — cap frozen HQ scale through Townhouse era. */
function ringMonumentFrozenHqScale(miniature: boolean, monumentStageIndex: number): number {
  const cappedStage = Math.min(monumentStageIndex, HQ_LAYOUT.sizeFactorHoldUntilStage);
  return hqSpriteSizeScale(miniature, cappedStage);
}

/** Ring scale — frozen at monument stage, tier bump, shrinks as current HQ outgrows. */
export function ringSpriteSizeScale(
  miniature: boolean,
  monumentStageIndex: number,
  currentHqStageIndex: number,
): number {
  const frozenAtStage = ringMonumentFrozenHqScale(miniature, monumentStageIndex);
  return (
    frozenAtStage *
    ringMonumentTierFactor(monumentStageIndex) *
    ringHqProgressShrink(currentHqStageIndex)
  );
}

/** Collision radius from rendered sprite width — used for overlap prevention. */
export function ringMonumentPlotFootprintRadius(
  buildingScale: number,
  isMiniature: boolean,
  monumentStageIndex: number,
  hqStageIndex = 15,
): number {
  const baseWidth = isMiniature ? 5.5 : 9.5;
  const sizeScale = ringSpriteSizeScale(isMiniature, monumentStageIndex, hqStageIndex);
  const width = buildingScale * baseWidth * sizeScale;
  return Math.max(isMiniature ? 2.2 : 2.8, width * 0.38);
}

/** Early wall-tier ring matches HQ at the same stage index. */
export function ringSpriteSizeMatchesHq(
  miniature: boolean,
  monumentStageIndex: number,
  currentHqStageIndex: number,
): boolean {
  if (monumentStageIndex > RING_TIER.earlyWallMax) return false;
  if (monumentStageIndex !== currentHqStageIndex) return false;
  const hq = hqSpriteSizeScale(miniature, currentHqStageIndex);
  const ring = ringSpriteSizeScale(miniature, monumentStageIndex, currentHqStageIndex);
  return Math.abs(ring - hq) < 0.001;
}

export { HQ_LAYOUT };
