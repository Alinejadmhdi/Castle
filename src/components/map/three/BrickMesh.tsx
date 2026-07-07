import { useRef } from 'react';
import type { Mesh } from 'three';
import type { Brick } from '@/types';
import {
  BRICK_DEPTH,
  BRICK_HEIGHT,
  BRICK_WIDTH,
  BRICK_VISUAL_INSET,
} from '@/rendering/three/constants';
import { gridToWorldPosition } from '@/rendering/three/gridToWorld';
import { wallBrickDisplayColor, wallBrickPlacementIndex } from '@/utils/brickColor';

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

  const w = BRICK_WIDTH * plotScale * scaleX * BRICK_VISUAL_INSET;
  const h = BRICK_HEIGHT * plotScale * BRICK_VISUAL_INSET;
  const d = BRICK_DEPTH * plotScale * BRICK_VISUAL_INSET;

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
      <meshToonMaterial
        color={wallBrickDisplayColor(brick.color, wallBrickPlacementIndex(brick))}
        emissive={highlighted ? '#ffffff' : brick.streakRewardLabel ? '#c9a227' : '#000000'}
        emissiveIntensity={highlighted ? 0.35 : brick.streakRewardLabel ? 0.2 : 0}
      />
    </mesh>
  );
}
