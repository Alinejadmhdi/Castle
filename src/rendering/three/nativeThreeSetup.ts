import { Platform } from 'react-native';

/**
 * Load R3F native first — patches THREE.TextureLoader for expo-gl (no DOM Image).
 * Must run before any `import * as THREE from 'three'` in the app bundle.
 */
if (Platform.OS !== 'web') {
  require('@react-three/fiber/native');
}

import * as THREE from 'three';

declare global {
  // eslint-disable-next-line no-var
  var THREE: typeof import('three');
}

if (typeof global.THREE === 'undefined') {
  global.THREE = THREE;
}

export { THREE };
