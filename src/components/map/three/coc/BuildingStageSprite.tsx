import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { CategoryType } from '@/types';
import {
  getBuildingPreviewSheetUris,
  getPreviewSheetSlice,
} from '@/rendering/three/buildingPreviewTextures';
import { COC_COLORS } from './cocPalette';

interface BuildingStageSpriteProps {
  stageIndex: number;
  categoryType: CategoryType;
  plotScale: number;
}

function sliceTexture(base: THREE.Texture, localIndex: number, cols: number) {
  const tex = base.clone();
  const cellW = 1 / cols;
  tex.repeat.set(cellW * 0.9, 0.82);
  tex.offset.set(localIndex * cellW + cellW * 0.05, 0.09);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  if ('colorSpace' in tex) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.needsUpdate = true;
  return tex;
}

let cachedSheetUris: string[] | null = null;

function getSheetUris() {
  if (!cachedSheetUris) {
    cachedSheetUris = getBuildingPreviewSheetUris();
  }
  return cachedSheetUris;
}

/** CoC reference art as a camera-facing sprite with a soft ground shadow. */
export function BuildingStageSprite({
  stageIndex,
  categoryType,
  plotScale,
}: BuildingStageSpriteProps) {
  const { sheetIndex, localIndex, cols } = getPreviewSheetSlice(stageIndex, categoryType);
  const sheetUris = getSheetUris();
  const textures = useLoader(THREE.TextureLoader, sheetUris);
  const sheet = textures[sheetIndex];

  const map = useMemo(
    () => sliceTexture(sheet, localIndex, cols),
    [sheet, localIndex, cols],
  );

  const miniature = categoryType === 'miniature';
  const width = plotScale * (miniature ? 5.5 : 9.5);
  const height = width * 0.92;
  const y = height * 0.42;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[width * 0.28, 28]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[width * 0.55, 0.1, width * 0.55]} />
        <meshStandardMaterial color={COC_COLORS.dirt} roughness={1} />
      </mesh>
      <Billboard position={[0, y, 0]} follow>
        <mesh renderOrder={2}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={map} transparent alphaTest={0.08} toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}
