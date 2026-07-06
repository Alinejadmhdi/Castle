import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';
import * as THREE from 'three';
import { COC_TEXTURE_ASSETS } from '@/constants/cocTextureAssets';

function resolveTextureUri(module: number): string {
  const resolved = resolveAssetSource(module);
  if (resolved?.uri) return resolved.uri;
  throw new Error('Unable to resolve CoC texture asset URI');
}

export interface CoCTextureSet {
  mapBaseplate: string;
  grass: string;
  dirt: string;
  villagePad: string;
  forest: string;
  brick: string;
}

/** Resolved URIs for Three.js TextureLoader (Expo web + native). */
export function getCoCTextureUris(): CoCTextureSet {
  return {
    mapBaseplate: resolveTextureUri(COC_TEXTURE_ASSETS.mapBaseplate),
    grass: resolveTextureUri(COC_TEXTURE_ASSETS.grass),
    dirt: resolveTextureUri(COC_TEXTURE_ASSETS.dirt),
    villagePad: resolveTextureUri(COC_TEXTURE_ASSETS.villagePad),
    forest: resolveTextureUri(COC_TEXTURE_ASSETS.forest),
    brick: resolveTextureUri(COC_TEXTURE_ASSETS.brick),
  };
}

export function getMapBaseplateUri(): string {
  return resolveTextureUri(COC_TEXTURE_ASSETS.mapBaseplate);
}

export function configureTileTexture(
  base: THREE.Texture,
  repeatX: number,
  repeatY: number,
): THREE.Texture {
  const tex = base.clone();
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if ('colorSpace' in tex) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.needsUpdate = true;
  return tex;
}
