import * as THREE from 'three';
import { getGroundDimensions } from './gridToWorld';
import { getMapViewHalfExtent } from './forestLayout';
import { getMonumentRingHalfExtent } from './settlementLayout';

export const COC_CAMERA_PITCH = Math.atan(1 / Math.sqrt(2));
export const COC_CAMERA_YAW = Math.PI / 4;
export const COC_ISO_POLAR = Math.PI / 2 - COC_CAMERA_PITCH;
export const COC_ISO_AZIMUTH = COC_CAMERA_YAW;

export const COC_BASE_DISTANCE = 34;

export const COC_DEFAULT_ZOOM = 2.15;
export const COC_ZOOM_MIN = 1.9;
export const COC_ZOOM_MAX = COC_DEFAULT_ZOOM;

/** Extra magnification centered on the plot (1.35 = 35% zoom in). */
export const MAP_CENTER_ZOOM = 1.35;

export type CoCCameraPlatform = 'web' | 'native';

/** Web uses camera.zoom; native (expo-gl) bakes zoom into ortho bounds instead. */
function resolveZoomForPlatform(
  platform: CoCCameraPlatform,
  zoom: number,
): { centerMag: number; boundsScale: number; cameraZoom: number } {
  if (platform === 'native') {
    return {
      centerMag: MAP_CENTER_ZOOM * zoom,
      boundsScale: 1,
      cameraZoom: 1,
    };
  }
  return {
    centerMag: MAP_CENTER_ZOOM,
    boundsScale: zoom,
    cameraZoom: zoom,
  };
}

/** Padding around projected map corners (forest ring included). */
export const VIEW_BOUNDS_PADDING = 1.06;

/** Map center — slight +Z shifts content toward bottom of viewport. */
export function getCameraLookAt(_plotScale: number): THREE.Vector3 {
  return new THREE.Vector3(0, 0, 0.65);
}

export function getCoCCameraOffset(distance: number): THREE.Vector3 {
  const horizontal = distance * Math.cos(COC_CAMERA_PITCH);
  return new THREE.Vector3(
    horizontal * Math.sin(COC_CAMERA_YAW),
    distance * Math.sin(COC_CAMERA_PITCH),
    horizontal * Math.cos(COC_CAMERA_YAW),
  );
}

/** Project map + forest corners into camera space and fit the ortho frustum. */
function getProjectedViewExtents(plotScale: number) {
  const { width } = getGroundDimensions(plotScale);
  const half = width / 2;
  const extent = getMapViewHalfExtent(half);
  const ringExtent = getMonumentRingHalfExtent(half);
  const lookAt = getCameraLookAt(plotScale);
  const camPos = lookAt.clone().add(getCoCCameraOffset(COC_BASE_DISTANCE * plotScale));

  const rig = new THREE.Object3D();
  rig.position.copy(camPos);
  rig.lookAt(lookAt);
  rig.updateMatrixWorld(true);
  const viewMatrix = new THREE.Matrix4().copy(rig.matrixWorld).invert();

  const samples = new Set<string>();
  const points: THREE.Vector3[] = [];
  const add = (x: number, z: number) => {
    const key = `${x.toFixed(2)},${z.toFixed(2)}`;
    if (samples.has(key)) return;
    samples.add(key);
    points.push(new THREE.Vector3(x, 0, z));
  };

  for (const x of [-extent, -half, 0, half, extent]) {
    for (const z of [-extent, -half, 0, half, extent]) {
      add(x, z);
    }
  }

  for (const x of [-ringExtent, ringExtent]) {
    for (const z of [-ringExtent, ringExtent]) {
      add(x, z);
    }
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const local = new THREE.Vector3();

  for (const p of points) {
    local.copy(p).applyMatrix4(viewMatrix);
    minX = Math.min(minX, local.x);
    maxX = Math.max(maxX, local.x);
    minY = Math.min(minY, local.y);
    maxY = Math.max(maxY, local.y);
  }

  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    halfW: ((maxX - minX) / 2) * VIEW_BOUNDS_PADDING,
    halfH: ((maxY - minY) / 2) * VIEW_BOUNDS_PADDING,
  };
}

export function getCoCOrthographicBounds(
  plotScale: number,
  aspect = 1,
  zoom = COC_DEFAULT_ZOOM,
  platform: CoCCameraPlatform = 'web',
) {
  const { centerMag, boundsScale } = resolveZoomForPlatform(platform, zoom);
  const { centerX, centerY, halfW, halfH } = getProjectedViewExtents(plotScale);
  const canvasAspect = Math.max(aspect, 0.5);
  let halfHeight = (halfH / centerMag) * boundsScale;
  let halfWidth = (halfW / centerMag) * boundsScale;

  if (halfWidth / halfHeight < canvasAspect) {
    halfWidth = halfHeight * canvasAspect;
  } else {
    halfHeight = halfWidth / canvasAspect;
  }

  return {
    left: centerX - halfWidth,
    right: centerX + halfWidth,
    top: centerY + halfHeight,
    bottom: centerY - halfHeight,
  };
}

export type { OverlayAxisDelta, OverlayPercent } from './overlayProjection';
export {
  getOverlayWorldAxisDeltas,
  projectPlotWorldToOverlayPercent,
} from './overlayProjection';

export function applyCoCCamera(
  camera: THREE.Camera,
  plotScale: number,
  zoom: number,
  lookAt = getCameraLookAt(plotScale),
  aspect = 1,
  platform: CoCCameraPlatform = 'web',
) {
  const distance = COC_BASE_DISTANCE * plotScale;
  const offset = getCoCCameraOffset(distance);

  camera.position.copy(lookAt).add(offset);
  camera.up.set(0, 1, 0);
  camera.lookAt(lookAt);

  if (camera instanceof THREE.OrthographicCamera) {
    const clampedZoom = Math.max(COC_ZOOM_MIN, Math.min(COC_ZOOM_MAX, zoom));
    const { cameraZoom } = resolveZoomForPlatform(platform, clampedZoom);
    const bounds = getCoCOrthographicBounds(plotScale, aspect, clampedZoom, platform);
    camera.left = bounds.left;
    camera.right = bounds.right;
    camera.top = bounds.top;
    camera.bottom = bounds.bottom;
    camera.zoom = cameraZoom;
    camera.updateProjectionMatrix();
  } else if (camera instanceof THREE.PerspectiveCamera) {
    camera.updateProjectionMatrix();
  }
}
