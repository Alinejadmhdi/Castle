import { useLayoutEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { MAP_BASEPLATE_ASPECT } from '@/constants/cocTextureAssets';
import { getMapBaseplateUri } from '@/rendering/three/cocEnvironmentTextures';

interface CoCMapBaseplateProps {
  /** World-space height of the painted map (width = height × aspect). */
  mapHeight: number;
}

let cachedUri: string | null = null;

function getUri() {
  if (!cachedUri) cachedUri = getMapBaseplateUri();
  return cachedUri;
}

/**
 * Full CoC-style painted map — central grass diamond, forest ring, water, waterfall.
 * Replaces tiled layers; forest/trees are baked into the artwork.
 */
export function CoCMapBaseplate({ mapHeight }: CoCMapBaseplateProps) {
  const uri = getUri();
  const texture = useLoader(THREE.TextureLoader, uri);

  useLayoutEffect(() => {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    if ('colorSpace' in texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
    texture.needsUpdate = true;
  }, [texture]);

  const mapWidth = useMemo(() => mapHeight * MAP_BASEPLATE_ASPECT, [mapHeight]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[mapWidth, mapHeight]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
