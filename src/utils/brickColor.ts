import { BRICK_DISPLAY_COLOR } from '@/rendering/three/constants';

const LEGACY_DARK_BRICK = new Set(['#6b7280', '#000000', '#1a1410', '#111111', '#000']);

/** Map legacy gray/black defaults to CoC brown; session colors pass through unchanged. */
export function resolveBrickDisplayColor(color: string): string {
  const normalized = color.trim().toLowerCase();
  if (LEGACY_DARK_BRICK.has(normalized)) return BRICK_DISPLAY_COLOR;
  return color;
}
