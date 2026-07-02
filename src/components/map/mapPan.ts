import type { MapPanDirection } from './SettlementMapControls';
import { getGroundDimensions } from '@/rendering/three/gridToWorld';

export interface MapPanOffset {
  x: number;
  z: number;
}

const PAN_STEP = 2;
const ISO = 1 / Math.sqrt(2);

/** Pan deltas aligned to the isometric camera (screen up/down/left/right). */
function panDelta(direction: MapPanDirection, step: number): { x: number; z: number } {
  switch (direction) {
    case 'up':
      return { x: -step * ISO, z: -step * ISO };
    case 'down':
      return { x: step * ISO, z: step * ISO };
    case 'left':
      return { x: -step * ISO, z: step * ISO };
    case 'right':
      return { x: step * ISO, z: -step * ISO };
  }
}

export function getMapPanLimits(plotScale: number) {
  const { width } = getGroundDimensions(plotScale);
  const limit = width * 0.28;
  return { x: limit, z: limit };
}

export function stepMapPan(
  pan: MapPanOffset,
  direction: MapPanDirection,
  plotScale: number,
): MapPanOffset {
  const step = PAN_STEP * plotScale;
  const limits = getMapPanLimits(plotScale);
  const delta = panDelta(direction, step);

  return {
    x: Math.max(-limits.x, Math.min(limits.x, pan.x + delta.x)),
    z: Math.max(-limits.z, Math.min(limits.z, pan.z + delta.z)),
  };
}
