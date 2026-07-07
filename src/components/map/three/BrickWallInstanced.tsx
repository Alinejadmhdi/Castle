import { useLayoutEffect, useMemo, useRef } from 'react';
import type { InstancedMesh } from 'three';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import type { Brick } from '@/types';
import {
  BRICK_DEPTH,
  BRICK_HEIGHT,
  BRICK_WIDTH,
  BRICK_VISUAL_INSET,
} from '@/rendering/three/constants';
import { gridToWorldPosition } from '@/rendering/three/gridToWorld';
import { wallBrickDisplayColor } from '@/utils/brickColor';
import { BrickMesh } from './BrickMesh';

interface BrickWallInstancedProps {
  bricks: Brick[];
  plotScale: number;
  highlightBrickId?: string | null;
  onPress?: (brick: Brick) => void;
}

/** Unit box with white vertex colors — required so instanceColor tints are not multiplied by black. */
function createBrickInstanceGeometry(): THREE.BoxGeometry {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const { count } = geometry.attributes.position;
  const colors = new Float32Array(count * 3);
  colors.fill(1);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

const dummy = new THREE.Object3D();
const tempColor = new THREE.Color();

function brighten(hex: string, amount: number): THREE.Color {
  tempColor.set(hex);
  tempColor.r = Math.min(1, tempColor.r + amount);
  tempColor.g = Math.min(1, tempColor.g + amount);
  tempColor.b = Math.min(1, tempColor.b + amount);
  return tempColor;
}

function brickDisplayColor(brick: Brick): THREE.Color {
  const base = wallBrickDisplayColor(brick.color, brick.gridX, brick.gridY);
  return brick.streakRewardLabel ? brighten(base, 0.12) : tempColor.set(base);
}

/** One draw call for the whole wall — per-brick colors via instanceColor. */
export function BrickWallInstanced({
  bricks,
  plotScale,
  highlightBrickId,
  onPress,
}: BrickWallInstancedProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const prevCountRef = useRef(0);
  const invalidate = useThree((s) => s.invalidate);

  const geometry = useMemo(() => createBrickInstanceGeometry(), []);
  const material = useMemo(
    () =>
      new THREE.MeshToonMaterial({
        vertexColors: true,
      }),
    [],
  );

  const { instancedBricks, highlightedBrick } = useMemo(() => {
    if (!highlightBrickId) {
      return { instancedBricks: bricks, highlightedBrick: null };
    }
    return {
      instancedBricks: bricks.filter((b) => b.id !== highlightBrickId),
      highlightedBrick: bricks.find((b) => b.id === highlightBrickId) ?? null,
    };
  }, [bricks, highlightBrickId]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || instancedBricks.length === 0) {
      prevCountRef.current = 0;
      return;
    }

    mesh.count = instancedBricks.length;

    for (let i = 0; i < instancedBricks.length; i++) {
      const brick = instancedBricks[i];
      const { x, y, z, scaleX } = gridToWorldPosition(
        brick.gridX,
        brick.gridY,
        brick.fractionalValue,
        plotScale,
      );
      const w = BRICK_WIDTH * plotScale * scaleX * BRICK_VISUAL_INSET;
      const h = BRICK_HEIGHT * plotScale * BRICK_VISUAL_INSET;
      const d = BRICK_DEPTH * plotScale * BRICK_VISUAL_INSET;

      dummy.position.set(x, y, z);
      dummy.scale.set(w, h, d);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, brickDisplayColor(brick));
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    prevCountRef.current = instancedBricks.length;
    invalidate();
  }, [instancedBricks, plotScale, invalidate]);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    const index = event.instanceId;
    if (index == null || !onPress) return;
    const brick = instancedBricks[index];
    if (brick) onPress(brick);
  }

  if (instancedBricks.length === 0 && !highlightedBrick) return null;

  return (
    <>
      {instancedBricks.length > 0 && (
        <instancedMesh
          ref={meshRef}
          args={[geometry, material, instancedBricks.length]}
          frustumCulled={false}
          onClick={onPress ? handleClick : undefined}
        />
      )}
      {highlightedBrick && (
        <BrickMesh
          brick={highlightedBrick}
          plotScale={plotScale}
          highlighted
          onPress={onPress}
        />
      )}
    </>
  );
}
