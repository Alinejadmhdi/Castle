import { BRICK_DISPLAY_COLOR } from '@/rendering/three/constants';

const LEGACY_DARK_BRICK = new Set(['#6b7280', '#000000', '#1a1410', '#111111', '#000']);

/** Map legacy gray/black defaults to CoC brown; session colors pass through unchanged. */
export function resolveBrickDisplayColor(color: string): string {
  const normalized = color.trim().toLowerCase();
  if (LEGACY_DARK_BRICK.has(normalized)) return BRICK_DISPLAY_COLOR;
  return color;
}

function darkenHex(hex: string, amount = 0.2): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - Math.round(255 * amount));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (n & 0xff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** 0-based placement order along the wall (globalIndex − 1). */
export function wallBrickPlacementIndex(brick: { globalIndex: number }): number {
  return Math.max(0, brick.globalIndex - 1);
}

/** Along-wall pattern: bright → dark → bright → dark by placement order. */
export function wallBrickDisplayColor(color: string, placementIndex: number): string {
  const base = resolveBrickDisplayColor(color);
  if (placementIndex % 2 === 1) return darkenHex(base);
  return base;
}

export function isWallBrickDarkVariant(placementIndex: number): boolean {
  return placementIndex % 2 === 1;
}
