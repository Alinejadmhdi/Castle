import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import {
  configureTileTexture,
  getCoCTextureUris,
} from '@/rendering/three/cocEnvironmentTextures';
import { COC_COLORS } from './cocPalette';

interface CoCTiledGroundProps {
  groundW: number;
  groundD: number;
  padSize: number;
}

let cachedUris: ReturnType<typeof getCoCTextureUris> | null = null;

function getUris() {
  if (!cachedUris) cachedUris = getCoCTextureUris();
  return cachedUris;
}

/** Layered CoC map — forest wilderness ring, grass village, dirt + work pad. */
export function CoCTiledGround({ groundW, groundD, padSize }: CoCTiledGroundProps) {
  const uris = getUris();
  const [grassBase, dirtBase, padBase, forestBase] = useLoader(THREE.TextureLoader, [
    uris.grass,
    uris.dirt,
    uris.villagePad,
    uris.forest,
  ]);

  const forestRing = useMemo(
    () => configureTileTexture(forestBase, (groundW * 2.4) / 6, (groundD * 2.4) / 6),
    [forestBase, groundW, groundD],
  );
  const grassInner = useMemo(
    () => configureTileTexture(grassBase, groundW / 4.5, groundD / 4.5),
    [grassBase, groundW, groundD],
  );
  const dirtPad = useMemo(
    () => configureTileTexture(dirtBase, padSize / 3.2, padSize / 3.2),
    [dirtBase, padSize],
  );
  const villagePad = useMemo(
    () => configureTileTexture(padBase, (padSize * 0.88) / 2.8, (padSize * 0.88) / 2.8),
    [padBase, padSize],
  );

  const forestSize = groundW * 2.35;

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[forestSize, forestSize]} />
        <meshStandardMaterial
          map={forestRing}
          color={COC_COLORS.wilderness}
          roughness={0.95}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[groundW, groundD]} />
        <meshStandardMaterial map={grassInner} color="#ffffff" roughness={0.9} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[padSize, padSize]} />
        <meshStandardMaterial map={dirtPad} color="#ffffff" roughness={0.98} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <planeGeometry args={[padSize * 0.88, padSize * 0.88]} />
        <meshStandardMaterial map={villagePad} color="#ffffff" roughness={0.98} />
      </mesh>
    </>
  );
}
