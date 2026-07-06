/**
 * Pure-math plot → 2D overlay projection for native Life Map.
 * Intentionally does NOT import three.js — keeps release APK stable on Android.
 */
import { getGroundDimensions } from './gridToWorld';
import { getMapViewHalfExtent } from './forestLayout';
import { getMonumentRingHalfExtent } from './settlementLayout';

import { HQ_LAYOUT } from './mapContentLayout';

export const OVERLAY_DEFAULT_ZOOM = 2.15;
export const OVERLAY_CENTER_ZOOM = 1.35;
export const OVERLAY_BOUNDS_PADDING = 1.06;

export type OverlayPlatform = 'web' | 'native';

export interface OverlayPercent {
  left: number;
  top: number;
}

export interface OverlayAxisDelta {
  dLeft: number;
  dTop: number;
}

/** Camera world rotation from CoC orthographic rig (plotScale = 1). */
const WORLD_ROT = {
  r00: -0.7071067811865476,
  r01: 0,
  r02: 0.7071067811865476,
  r10: -0.4082482904638631,
  r11: 0.816496580927726,
  r12: -0.4082482904638631,
  r20: -0.5773502691896258,
  r21: -0.5773502691896258,
  r22: -0.5773502691896258,
} as const;

/** Camera eye position at plotScale = 1. */
const BASE_EYE = {
  x: 19.629862177490234,
  y: 19.629862177490234,
  z: 20.279862177490234,
} as const;

function getViewMatrix(plotScale: number): number[] {
  const { r00, r01, r02, r10, r11, r12, r20, r21, r22 } = WORLD_ROT;
  const ex = BASE_EYE.x * plotScale;
  const ey = BASE_EYE.y * plotScale;
  const ez = BASE_EYE.z * plotScale;
  const itx = -(r00 * ex + r10 * ey + r20 * ez);
  const ity = -(r01 * ex + r11 * ey + r21 * ez);
  const itz = -(r02 * ex + r12 * ey + r22 * ez);
  return [
    r00, r10, r20, 0,
    r01, r11, r21, 0,
    r02, r12, r22, 0,
    itx, ity, itz, 1,
  ];
}

function applyViewMatrix(m: number[], x: number, z: number): { x: number; y: number } {
  return {
    x: x * m[0] + z * m[8] + m[12],
    y: x * m[1] + z * m[9] + m[13],
  };
}

function resolveZoom(platform: OverlayPlatform, zoom: number) {
  if (platform === 'native') {
    return { centerMag: OVERLAY_CENTER_ZOOM * zoom, boundsScale: 1 };
  }
  return { centerMag: OVERLAY_CENTER_ZOOM, boundsScale: zoom };
}

function getProjectedViewExtents(plotScale: number) {
  const { width } = getGroundDimensions(plotScale);
  const half = width / 2;
  const extent = getMapViewHalfExtent(half);
  const ringExtent = getMonumentRingHalfExtent(half);
  const viewMatrix = getViewMatrix(plotScale);

  const samples = new Set<string>();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const add = (x: number, z: number) => {
    const key = `${x.toFixed(2)},${z.toFixed(2)}`;
    if (samples.has(key)) return;
    samples.add(key);
    const local = applyViewMatrix(viewMatrix, x, z);
    minX = Math.min(minX, local.x);
    maxX = Math.max(maxX, local.x);
    minY = Math.min(minY, local.y);
    maxY = Math.max(maxY, local.y);
  };

  for (const x of [-extent, -half, 0, half, extent]) {
    for (const z of [-extent, -half, 0, half, extent]) {
      add(x, z);
    }
  }
  for (const x of [-ringExtent, ringExtent]) {
    for (const z of [-ringExtent, ringExtent]) {
      add(x, z);
    }
  }

  // Wall row sits beyond the soil pad — include so ortho bounds cover brick overlay.
  const { half: soilHalf } = (() => {
    const { width } = getGroundDimensions(plotScale);
    const side = width * 0.44;
    return { half: side / 2 };
  })();
  const wallBaseZ =
    soilHalf -
    0.06 -
    0.25 +
    -0.85; // BRICK_GAP, BRICK_DEPTH/2, WALL_LAYOUT.offsetZ
  const wallZ =
    HQ_LAYOUT.worldZ + (wallBaseZ - HQ_LAYOUT.worldZ) * 3; // distanceFromHqMultiplier
  const wallMinX = -soilHalf;
  const wallMaxX = soilHalf;
  for (const x of [wallMinX, 0, wallMaxX]) {
    add(x, wallZ);
  }

  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    halfW: ((maxX - minX) / 2) * OVERLAY_BOUNDS_PADDING,
    halfH: ((maxY - minY) / 2) * OVERLAY_BOUNDS_PADDING,
    viewMatrix,
  };
}

function getOrthographicBounds(
  plotScale: number,
  aspect = 1,
  zoom = OVERLAY_DEFAULT_ZOOM,
  platform: OverlayPlatform = 'native',
) {
  const { centerMag, boundsScale } = resolveZoom(platform, zoom);
  const { centerX, centerY, halfW, halfH, viewMatrix } = getProjectedViewExtents(plotScale);
  const canvasAspect = Math.max(aspect, 0.5);
  let halfHeight = (halfH / centerMag) * boundsScale;
  let halfWidth = (halfW / centerMag) * boundsScale;

  if (halfWidth / halfHeight < canvasAspect) {
    halfWidth = halfHeight * canvasAspect;
  } else {
    halfHeight = halfWidth / canvasAspect;
  }

  return {
    left: centerX - halfWidth,
    right: centerX + halfWidth,
    top: centerY + halfHeight,
    bottom: centerY - halfHeight,
    viewMatrix,
  };
}

/** HQ anchor on the painted baseplate (% of square plot). */
const HQ_SCREEN = { left: 50, top: 52 };
/** Fine-tune 2D overlay vs painted coc-map-baseplate.png */
const OVERLAY_PAN = { left: 0, top: -4 };

/** Project unscaled plot XZ into % coords for the square native Life Map overlay. */
export function projectPlotWorldToOverlayPercent(
  worldX: number,
  worldZ: number,
  plotScale = 1,
  aspect = 1,
  platform: OverlayPlatform = 'native',
): OverlayPercent {
  const bounds = getOrthographicBounds(plotScale, aspect, OVERLAY_DEFAULT_ZOOM, platform);
  const local = applyViewMatrix(bounds.viewMatrix, worldX, worldZ);
  const cx = (bounds.left + bounds.right) / 2;
  const cy = (bounds.top + bounds.bottom) / 2;
  const hw = (bounds.right - bounds.left) / 2;
  const hh = (bounds.top - bounds.bottom) / 2;

  const nx = (local.x - cx) / hw;
  const ny = (local.y - cy) / hh;

  return {
    left: HQ_SCREEN.left + OVERLAY_PAN.left + nx * 50,
    top: HQ_SCREEN.top + OVERLAY_PAN.top - ny * 50,
  };
}

/** Screen-space direction of +X / +Z plot axes (percent per 1 world unit). */
export function getOverlayWorldAxisDeltas(
  plotScale = 1,
  aspect = 1,
  platform: OverlayPlatform = 'native',
): { x: OverlayAxisDelta; z: OverlayAxisDelta } {
  const origin = projectPlotWorldToOverlayPercent(0, 0, plotScale, aspect, platform);
  const xEnd = projectPlotWorldToOverlayPercent(1, 0, plotScale, aspect, platform);
  const zEnd = projectPlotWorldToOverlayPercent(0, 1, plotScale, aspect, platform);
  return {
    x: { dLeft: xEnd.left - origin.left, dTop: xEnd.top - origin.top },
    z: { dLeft: zEnd.left - origin.left, dTop: zEnd.top - origin.top },
  };
}
