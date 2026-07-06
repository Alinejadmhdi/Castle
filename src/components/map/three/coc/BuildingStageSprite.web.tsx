import { useLayoutEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { CategoryType } from '@/types';
import { getBuildingStageUri } from '@/rendering/three/buildingPreviewTextures';

interface BuildingStageSpriteProps {
  stageIndex: number;
  categoryType: CategoryType;
  plotScale: number;
  /** Footprint multiplier — use spriteSizeScale() from cocPalette. */
  sizeScale?: number;
  /** Lower on screen when true (center HQ). */
  anchorLow?: boolean;
  /** Isometric depth sort — higher draws on top of lower. */
  renderOrder?: number;
}

/** CoC building cutout — transparent PNG billboard, no ground pad beneath. */
export function BuildingStageSprite({
  stageIndex,
  categoryType,
  plotScale,
  sizeScale = 1,
  anchorLow = false,
  renderOrder = 1,
}: BuildingStageSpriteProps) {
  const uri = getBuildingStageUri(stageIndex);
  const texture = useLoader(THREE.TextureLoader, uri);

  useLayoutEffect(() => {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    if ('colorSpace' in texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
    texture.needsUpdate = true;
  }, [texture]);

  const aspect = useMemo(() => {
    const img = texture.image as { width?: number; height?: number } | undefined;
    if (img?.width && img?.height) return img.height / img.width;
    return 0.94;
  }, [texture]);

  const miniature = categoryType === 'miniature';
  const baseWidth = miniature ? 5.5 : 9.5;
  const width = plotScale * baseWidth * sizeScale;
  const height = width * aspect;
  const anchor = anchorLow ? 0.34 : 0.4;
  const y = height * anchor;

  return (
    <Billboard position={[0, y, 0]} follow>
      <mesh renderOrder={renderOrder}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.04}
          toneMapped={false}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </Billboard>
  );
}
