import { useMemo } from 'react';
import { getGroundDimensions } from '@/rendering/three/gridToWorld';
import { getMapViewHalfExtent } from '@/rendering/three/forestLayout';
import { CoCMapBaseplate } from './coc/CoCMapBaseplate';

interface CoCMapEnvironmentProps {
  plotScale?: number;
  /** Monument slots — kept for API compatibility. */
  buildingSlots?: { plotX: number; plotY: number }[];
  treeClearRadius?: number;
}

/** CoC village map — single painted baseplate (forest, water, grass diamond). */
export function CoCMapEnvironment({ plotScale = 1 }: CoCMapEnvironmentProps) {
  const { width: groundW } = useMemo(() => getGroundDimensions(plotScale), [plotScale]);
  const half = groundW / 2;
  const extent = getMapViewHalfExtent(half);

  /** Sized so forest/water/waterfall fill the orthographic view. */
  const mapHeight = extent * 2.05;

  return (
    <group>
      <CoCMapBaseplate mapHeight={mapHeight} />
    </group>
  );
}
