import { OrbitControls } from '@react-three/drei/core/OrbitControls';
import { TOUCH } from 'three';
import {
  COC_ISO_AZIMUTH,
  COC_ISO_POLAR,
  COC_ZOOM_MAX,
  COC_ZOOM_MIN,
} from '@/rendering/three/cocCamera';

interface SettlementControlsProps {
  lookAt: [number, number, number];
}

/** Zoom-out only — CameraRig re-locks the 45° angle after each update. */
export function SettlementControls({ lookAt }: SettlementControlsProps) {
  return (
    <OrbitControls
      makeDefault
      target={lookAt}
      enableDamping={false}
      enableRotate={false}
      enablePan={false}
      enableZoom
      minPolarAngle={COC_ISO_POLAR}
      maxPolarAngle={COC_ISO_POLAR}
      minAzimuthAngle={COC_ISO_AZIMUTH}
      maxAzimuthAngle={COC_ISO_AZIMUTH}
      minZoom={COC_ZOOM_MIN}
      maxZoom={COC_ZOOM_MAX}
      zoomSpeed={1.1}
      screenSpacePanning={false}
      touches={{
        ONE: TOUCH.ROTATE,
        TWO: TOUCH.DOLLY_PAN,
      }}
    />
  );
}
