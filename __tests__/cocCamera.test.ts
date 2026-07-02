import * as THREE from 'three';
import {
  applyCoCCamera,
  COC_DEFAULT_ZOOM,
  getCoCOrthographicBounds,
} from '../src/rendering/three/cocCamera';
import { getGroundDimensions } from '../src/rendering/three/gridToWorld';

function projectPoint(camera: THREE.OrthographicCamera, x: number, z: number) {
  const v = new THREE.Vector3(x, 0, z);
  v.project(camera);
  return { x: v.x, y: v.y, z: v.z };
}

describe('cocCamera', () => {
  it('frames the full map within the orthographic view (web)', () => {
    const plotScale = 1;
    const aspect = 1;
    const bounds = getCoCOrthographicBounds(plotScale, aspect, COC_DEFAULT_ZOOM);
    const camera = new THREE.OrthographicCamera(
      bounds.left,
      bounds.right,
      bounds.top,
      bounds.bottom,
      0.1,
      500,
    );
    applyCoCCamera(camera, plotScale, COC_DEFAULT_ZOOM, undefined, aspect);

    const { width } = getGroundDimensions(plotScale);
    const half = width / 2;
    const corners = [
      [0, 0],
      [half, half],
      [-half, -half],
      [half, -half],
      [-half, half],
    ];

    for (const [x, z] of corners) {
      const p = projectPoint(camera, x, z);
      expect(p.x).toBeGreaterThanOrEqual(-1.05);
      expect(p.x).toBeLessThanOrEqual(1.05);
      expect(p.y).toBeGreaterThanOrEqual(-1.05);
      expect(p.y).toBeLessThanOrEqual(1.05);
    }

    expect(bounds.right - bounds.left).toBeGreaterThan(0);
    expect(bounds.top - bounds.bottom).toBeGreaterThan(0);
    expect(Number.isFinite(bounds.left)).toBe(true);
  });

  it('frames the full map on native (zoom baked into bounds)', () => {
    const plotScale = 1;
    const aspect = 1;
    const bounds = getCoCOrthographicBounds(plotScale, aspect, COC_DEFAULT_ZOOM, 'native');
    const camera = new THREE.OrthographicCamera(
      bounds.left,
      bounds.right,
      bounds.top,
      bounds.bottom,
      0.1,
      500,
    );
    applyCoCCamera(camera, plotScale, COC_DEFAULT_ZOOM, undefined, aspect, 'native');

    expect(camera.zoom).toBe(1);

    const { width } = getGroundDimensions(plotScale);
    const half = width / 2;
    const p = projectPoint(camera, half, half);
    expect(p.x).toBeGreaterThanOrEqual(-1.05);
    expect(p.x).toBeLessThanOrEqual(1.05);
    expect(p.y).toBeGreaterThanOrEqual(-1.05);
    expect(p.y).toBeLessThanOrEqual(1.05);
  });
});
