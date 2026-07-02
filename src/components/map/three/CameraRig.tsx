import { useCallback, useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import {
  applyCoCCamera,
  COC_DEFAULT_ZOOM,
  getCameraLookAt,
} from '@/rendering/three/cocCamera';

interface CameraRigProps {
  plotScale: number;
}

/** Locks 45° isometric camera and ortho bounds when layout or plot changes. */
export function CameraRig({ plotScale }: CameraRigProps) {
  const { camera, size, invalidate } = useThree();

  const apply = useCallback(() => {
    if (size.width < 1 || size.height < 1) return;
    const aspect = size.width / size.height;
    applyCoCCamera(
      camera,
      plotScale,
      COC_DEFAULT_ZOOM,
      getCameraLookAt(plotScale),
      aspect,
    );
  }, [camera, plotScale, size.height, size.width]);

  useLayoutEffect(() => {
    apply();
    invalidate();
  }, [apply, invalidate]);

  return null;
}
