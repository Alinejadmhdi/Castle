import * as THREE from 'three';

/** Metro + three.js side effects — required for expo-gl on React Native (expo-three docs). */
declare global {
  // eslint-disable-next-line no-var
  var THREE: typeof import('three');
}

if (typeof global.THREE === 'undefined') {
  global.THREE = THREE;
}

export { THREE };
