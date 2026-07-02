import type { BuildingInstance } from '@/types';
import { BRICK_HEIGHT, BRICK_WIDTH } from '@/rendering/three/constants';
import { getGroundDimensions } from '@/rendering/three/gridToWorld';

interface BuildingMeshProps {
  building: BuildingInstance;
  index: number;
  plotScale: number;
}

/** Small markers for daily / compound structures — kept inside the ground bounds. */
export function BuildingMesh({ building, index, plotScale }: BuildingMeshProps) {
  if (building.kind === 'macro' || building.kind === 'sub') return null;

  const { width: groundW, depth: groundD } = getGroundDimensions(plotScale);
  const inset = 0.15 * plotScale;
  const halfW = groundW / 2 - inset;
  const halfD = groundD / 2 - inset;

  const w = BRICK_WIDTH * 1.4 * plotScale * building.scale;
  const h = BRICK_HEIGHT * 2.5 * plotScale * building.scale;
  const d = BRICK_WIDTH * 1.2 * plotScale * building.scale;

  const col = index % 3;
  const row = Math.floor(index / 3);
  const rawX = -halfW + w / 2 + col * (w + 0.4 * plotScale);
  const rawZ = -halfD + d / 2 + row * (d + 0.35 * plotScale);

  const x = Math.max(-halfW + w / 2, Math.min(halfW - w / 2, rawX));
  const z = Math.max(-halfD + d / 2, Math.min(halfD - d / 2, rawZ));
  const y = h / 2;

  const color = building.kind === 'daily' ? '#6b8e5a' : '#7a6a4f';

  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.88} metalness={0.05} />
    </mesh>
  );
}
