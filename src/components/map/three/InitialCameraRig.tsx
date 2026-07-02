import { useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  COC_BASE_DISTANCE,
  COC_DEFAULT_ZOOM,
  COC_ISO_AZIMUTH,
  COC_ISO_POLAR,
  COC_ZOOM_MAX,
  COC_ZOOM_MIN,
  getCoCCameraOffset,
} from '@/rendering/three/cocCamera';

interface InitialCameraRigProps {
  lookAt: [number, number, number];
  plotScale: number;
  initialZoom?: number;
}

/** One-time isometric camera placement; pan/zoom left to OrbitControls. */
export function InitialCameraRig({
  lookAt,
  plotScale,
  initialZoom = COC_DEFAULT_ZOOM,
}: InitialCameraRigProps) {
  const { camera } = useThree();

  useLayoutEffect(() => {
    const target = new THREE.Vector3(...lookAt);
    const offset = getCoCCameraOffset(COC_BASE_DISTANCE * plotScale);
    camera.position.copy(target).add(offset);
    camera.lookAt(target);

    const spherical = new THREE.Spherical();
    spherical.setFromVector3(camera.position.clone().sub(target));
    spherical.phi = COC_ISO_POLAR;
    spherical.theta = COC_ISO_AZIMUTH;
    camera.position.setFromSpherical(spherical).add(target);
    camera.lookAt(target);

    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = Math.max(COC_ZOOM_MIN, Math.min(COC_ZOOM_MAX, initialZoom));
      camera.updateProjectionMatrix();
    }
  }, [camera, lookAt, plotScale, initialZoom]);

  useFrame(() => {
    const target = new THREE.Vector3(...lookAt);
    const offset = getCoCCameraOffset(COC_BASE_DISTANCE * plotScale);
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(offset);
    spherical.phi = COC_ISO_POLAR;
    spherical.theta = COC_ISO_AZIMUTH;
    camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical));
    camera.lookAt(target);
  });

  return null;
}
