import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber/native';

interface SceneInvalidatorProps {
  bricksCount: number;
  buildingsCount: number;
  totalBrickValue: number;
}

/** Triggers a render when scene data changes (required with frameloop="demand"). */
export function SceneInvalidator({
  bricksCount,
  buildingsCount,
  totalBrickValue,
}: SceneInvalidatorProps) {
  const invalidate = useThree((s) => s.invalidate);

  useLayoutEffect(() => {
    invalidate();
  }, [bricksCount, buildingsCount, totalBrickValue, invalidate]);

  return null;
}
