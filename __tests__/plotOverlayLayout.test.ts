import { gridToWorldPosition } from '../src/rendering/three/gridToWorld';
import { HQ_LAYOUT } from '../src/rendering/three/mapContentLayout';
import {
  getOverlayWorldAxisDeltas,
  projectPlotWorldToOverlayPercent,
} from '../src/rendering/three/overlayProjection';
import { worldToOverlayPercent } from '../src/rendering/three/plotOverlayLayout';

function wallRowAngle(z: number): number {
  const a = worldToOverlayPercent(-4, z, 1);
  const b = worldToOverlayPercent(4, z, 1);
  return (Math.atan2(b.top - a.top, b.left - a.left) * 180) / Math.PI;
}

describe('plotOverlayLayout', () => {
  it('projects wall rows at CoC isometric angle (~±30° from horizontal)', () => {
    const z = gridToWorldPosition(0, 0, 1, 1).z;
    const angle = wallRowAngle(z);
    expect(angle).toBeGreaterThan(120);
    expect(angle).toBeLessThan(160);
  });

  it('uses equal-magnitude X and Z screen axes (isometric)', () => {
    const { x, z } = getOverlayWorldAxisDeltas(1);
    const xMag = Math.hypot(x.dLeft, x.dTop);
    const zMag = Math.hypot(z.dLeft, z.dTop);
    expect(xMag).toBeGreaterThan(0.5);
    expect(Math.abs(xMag - zMag)).toBeLessThan(0.05);
  });

  it('maps HQ center near the plot middle', () => {
    const p = projectPlotWorldToOverlayPercent(HQ_LAYOUT.worldX, HQ_LAYOUT.worldZ, 1);
    expect(p.left).toBeGreaterThan(40);
    expect(p.left).toBeLessThan(60);
    expect(p.top).toBeGreaterThan(40);
    expect(p.top).toBeLessThan(60);
  });
});
