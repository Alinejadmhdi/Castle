import { COC_COLORS } from './cocPalette';

/** Lighting for 3D content only — map background is a flat 2D image behind the canvas. */
export function CoCLighting() {
  return (
    <>
      <ambientLight intensity={0.62} color="#fff8ee" />
      <hemisphereLight args={['#72c858', '#2d6a22', 0.44]} />
      <directionalLight position={[18, 28, 14]} intensity={1.58} color="#fff4d0" />
      <directionalLight position={[-12, 16, -10]} intensity={0.3} color="#d0e8c8" />
    </>
  );
}
