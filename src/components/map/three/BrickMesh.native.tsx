import { useRef } from 'react';
import type { Mesh } from 'three';
import * as THREE from 'three';
import type { Brick } from '@/types';
import { BRICK_DEPTH, BRICK_HEIGHT, BRICK_WIDTH } from '@/rendering/three/constants';
import { gridToWorldPosition } from '@/rendering/three/gridToWorld';
import { resolveBrickDisplayColor } from '@/utils/brickColor';

interface BrickMeshProps {
  brick: Brick;
  plotScale: number;
  highlighted: boolean;
  onPress?: (brick: Brick) => void;
}

export function BrickMesh({ brick, plotScale, highlighted, onPress }: BrickMeshProps) {
  const ref = useRef<Mesh>(null);
  const { x, y, z, scaleX } = gridToWorldPosition(
    brick.gridX,
    brick.gridY,
    brick.fractionalValue,
    plotScale,
  );

  const w = BRICK_WIDTH * plotScale * scaleX;
  const h = BRICK_HEIGHT * plotScale;
  const d = BRICK_DEPTH * plotScale;
  let color = resolveBrickDisplayColor(brick.color);
  if (highlighted) color = '#ffffff';
  else if (brick.streakRewardLabel) color = '#e8c547';

  return (
    <mesh
      ref={ref}
      position={[x, y, z]}
      onClick={(e) => {
        e.stopPropagation();
        onPress?.(brick);
      }}
    >
      <boxGeometry args={[w, h, d]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}
