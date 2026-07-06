/**
 * Tunes 3D gameplay placement against the flat coc-map-baseplate (2D cover).
 * Adjust these when the painted grass diamond and 3D content drift apart.
 */

/** Shift all gameplay content (wall, HQ, ring). */
export const MAP_SCENE_OFFSET = {
  x: 0,
  z: 0.2,
} as const;

/** Center HQ building on the inner grass diamond. */
export const HQ_LAYOUT = {
  /** HQ scale at stage 0 — matches ring monument baseline (Low Wall era). */
  sizeFactorStart: 0.62,
  /** HQ scale at Castle (stage 26). */
  sizeFactorMax: 3,
  /** Stages 0–15 (through Townhouse): HQ stays ring-sized. */
  sizeFactorHoldUntilStage: 15,
  /** Manor (16) onward: HQ grows exponentially to sizeFactorMax by stage 26. */
  sizeFactorGrowEndStage: 26,
  worldX: 0,
  /** +Z ≈ toward bottom of screen — sits on lower half of diamond. */
  worldZ: 0.75,
} as const;

/** Flat ring-sized HQ through Townhouse; exponential growth from Manor → Castle. */
export function hqStageSizeFactor(stageIndex: number): number {
  const s = Math.min(26, Math.max(0, stageIndex));
  const { sizeFactorStart: start, sizeFactorMax: max, sizeFactorHoldUntilStage: holdUntil, sizeFactorGrowEndStage: growEnd } =
    HQ_LAYOUT;
  if (s <= holdUntil) return start;
  if (s >= growEnd) return max;
  const t = (s - holdUntil) / (growEnd - holdUntil);
  return start * Math.pow(max / start, t);
}

/** True when a monument stage is the active HQ — must not render on the ring. */
export function isActiveHqStage(stageIndex: number, currentStageIndex: number): boolean {
  return stageIndex === currentStageIndex;
}

/** Ring monuments fill the band from HQ outward, stopping just before the wall. */
export const RING_LAYOUT = {
  /** Legacy fine-tune — ring scale is HQ-relative in ringBuildingScale.ts */
  sizeFactor: 1.5,
  /** Max ring radius as fraction of HQ→wall span (1 = as far as wall). */
  placementMaxSpanFactor: 0.9,
  /** World-units inset from wall edge for outermost ring. */
  wallInset: 3,
  /** Gap beyond HQ footprint before innermost ring. */
  minRadiusPad: 2.5,
  /** Extra gap between monument collision circles. */
  slotGap: 5,
} as const;

/** Brick wall along the front inner edge of the grass diamond (+Z). */
export const WALL_LAYOUT = {
  edge: 'front' as const,
  /** Nudge wall horizontally (world X). */
  offsetX: 0.25,
  /** Nudge along the wall edge (world Z). Negative pulls wall toward map center. */
  offsetZ: -0.85,
} as const;

/**
 * Native 2D wall line on coc-map-baseplate (% of square plot).
 * 2D overlay uses screen % anchors; 3D wall uses WALL_LAYOUT + gridToWorldPosition.
 */
export const WALL_OVERLAY = {
  start: { left: 22, top: 30 },
  end: { left: 78, top: 30 },
  /** Screen rise per wall course (gridY). */
  courseRise: 3.4,
  /** Full brick width as % of plot width. */
  brickWidthPct: 6.5,
} as const;

/** Center HQ on the inner grass diamond (% of square plot). */
export const HQ_OVERLAY = {
  centerLeft: 50,
  centerTop: 56,
  widthPct: 30,
} as const;

/** Isometric draw order — higher +Z / +X draws on top (ring in front of HQ). */
export function spriteDepthRenderOrder(worldX: number, worldZ: number): number {
  return Math.round((worldX + worldZ) * 10) + 1;
}

/** Inner playable square — fraction of ground width for wall bounds. */
export const SOIL_PAD_SCALE = 0.44;
