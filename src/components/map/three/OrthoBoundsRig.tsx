import { useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getCoCOrthographicBounds } from '@/rendering/three/cocCamera';

interface OrthoBoundsRigProps {
  plotScale: number;
}

/** Keeps orthographic frustum fitted to the building pad at current zoom. */
export function OrthoBoundsRig({ plotScale }: OrthoBoundsRigProps) {
  const { camera, size } = useThree();

  const applyBounds = () => {
    if (!(camera instanceof THREE.OrthographicCamera)) return;
    const aspect = size.width / Math.max(size.height, 1);
    const bounds = getCoCOrthographicBounds(plotScale, aspect, camera.zoom);
    camera.left = bounds.left;
    camera.right = bounds.right;
    camera.top = bounds.top;
    camera.bottom = bounds.bottom;
    camera.updateProjectionMatrix();
  };

  useLayoutEffect(applyBounds, [camera, plotScale, size.height, size.width]);

  useFrame(applyBounds);

  return null;
}
