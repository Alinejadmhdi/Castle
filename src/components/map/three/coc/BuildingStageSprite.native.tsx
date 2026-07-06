import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber/native';
import { THREE } from '@/rendering/three/nativeThreeSetup';
import type { CategoryType } from '@/types';
import { getBuildingStageUri } from '@/rendering/three/buildingPreviewTextures';

export interface BuildingStageSpriteProps {
  stageIndex: number;
  categoryType: CategoryType;
  plotScale: number;
  sizeScale?: number;
  anchorLow?: boolean;
  renderOrder?: number;
}

/** Native expo-gl sprite — camera-facing plane (no drei / DOM). */
export function BuildingStageSprite({
  stageIndex,
  categoryType,
  plotScale,
  sizeScale = 1,
  anchorLow = false,
  renderOrder = 1,
}: BuildingStageSpriteProps) {
  const faceRef = useRef<THREE.Group>(null);
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

  useFrame(({ camera }) => {
    if (faceRef.current) {
      faceRef.current.quaternion.copy(camera.quaternion);
    }
  });

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
    <group position={[0, y, 0]}>
      <group ref={faceRef}>
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
      </group>
    </group>
  );
}
