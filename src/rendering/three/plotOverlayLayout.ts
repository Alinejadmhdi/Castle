import type { ImageStyle, ViewStyle } from 'react-native';
import type { CategoryType } from '@/types';
import type { Brick } from '@/types';
import { BRICK_DEPTH, BRICK_HEIGHT, BRICK_WIDTH, SOIL_GRID_COLUMNS } from '@/rendering/three/constants';
import { HQ_LAYOUT, MAP_SCENE_OFFSET, WALL_OVERLAY } from '@/rendering/three/mapContentLayout';
import { gridToWorldPosition, getGroundDimensions } from '@/rendering/three/gridToWorld';
import { SPRITE_BASE_WIDTH, spriteSizeScale } from '@/components/map/three/coc/cocPalette';
import {
  getOverlayWorldAxisDeltas,
  projectPlotWorldToOverlayPercent,
} from '@/rendering/three/overlayProjection';

/** Map unscaled 3D plot coordinates to % position inside the square Life Map crop. */
export function worldToOverlayPercent(
  worldX: number,
  worldZ: number,
  plotScale = 1,
): { left: number; top: number } {
  return projectPlotWorldToOverlayPercent(
    worldX + MAP_SCENE_OFFSET.x,
    worldZ + MAP_SCENE_OFFSET.z,
    plotScale,
  );
}

function worldSizeToPercent(size: number, plotScale: number): number {
  const { width: groundW } = getGroundDimensions(plotScale);
  return (size / groundW) * 100 * 2.05;
}

function spriteWidthPercent(
  plotScale: number,
  sizeScale: number,
  miniature: boolean,
): number {
  const baseWidth = miniature ? SPRITE_BASE_WIDTH.miniature : SPRITE_BASE_WIDTH.standard;
  const worldW = plotScale * baseWidth * sizeScale;
  return Math.min(52, Math.max(8, worldSizeToPercent(worldW, plotScale)));
}

function pct(value: number): `${number}%` {
  return `${value}%`;
}

export function hqOverlayLayout(
  plotScale: number,
  stageIndex: number,
  categoryType: CategoryType,
): ImageStyle {
  const miniature = categoryType === 'miniature';
  const sizeScale = spriteSizeScale(false, miniature, stageIndex);
  const width = spriteWidthPercent(plotScale, sizeScale, miniature);
  const { left, top } = worldToOverlayPercent(HQ_LAYOUT.worldX, HQ_LAYOUT.worldZ, plotScale);
  return {
    position: 'absolute',
    left: pct(left - width / 2),
    top: pct(top - width * 0.38),
    width: pct(width),
    aspectRatio: 0.94,
  };
}

export function monumentOverlayLayout(
  plotX: number,
  plotY: number,
  plotScale: number,
  stageIndex: number,
  currentHqStageIndex: number,
  buildingScale: number,
): ImageStyle {
  const sizeScale = spriteSizeScale(true, false, stageIndex, currentHqStageIndex) * buildingScale;
  const width = spriteWidthPercent(plotScale, sizeScale, false);
  const { left, top } = worldToOverlayPercent(plotX, plotY, plotScale);
  return {
    position: 'absolute',
    left: pct(left - width / 2),
    top: pct(top - width * 0.4),
    width: pct(width),
    aspectRatio: 0.94,
  };
}

export interface BrickOverlayLayout {
  container: ViewStyle;
  topHeightPct: `${number}%`;
  frontHeightPct: `${number}%`;
  depthSkewLeftPct: `${number}%`;
  depthSkewTopPct: `${number}%`;
}

/** 2D isometric brick chip — grid layout on native; same gridToWorld as 3D web. */
export function brickOverlayLayout(brick: Brick, plotScale: number): BrickOverlayLayout {
  const { scaleX } = gridToWorldPosition(
    brick.gridX,
    brick.gridY,
    brick.fractionalValue,
    plotScale,
  );

  const cols = Math.max(1, SOIL_GRID_COLUMNS);
  const t = cols <= 1 ? 0 : brick.gridX / (cols - 1);
  const { start, end, courseRise, brickWidthPct } = WALL_OVERLAY;
  const left =
    start.left + t * (end.left - start.left);
  const top =
    start.top + t * (end.top - start.top) - brick.gridY * courseRise;

  const widthPct = brickWidthPct * scaleX * plotScale;
  const heightPct = widthPct * (BRICK_HEIGHT / BRICK_WIDTH);

  const unitPct = brickWidthPct * plotScale;
  const { z: zAxis } = getOverlayWorldAxisDeltas(plotScale);
  const depthSkewLeft = zAxis.dLeft * unitPct * BRICK_DEPTH;
  const depthSkewTop = zAxis.dTop * unitPct * BRICK_DEPTH;

  const topFacePct = heightPct * 0.28;
  const frontFacePct = heightPct * 0.72;

  return {
    container: {
      position: 'absolute',
      left: pct(left - widthPct / 2 + depthSkewLeft * 0.28),
      top: pct(top - topFacePct - frontFacePct - depthSkewTop * 0.45),
      width: pct(widthPct),
      zIndex: brick.gridY * 100 + brick.gridX + 1,
    },
    topHeightPct: pct(topFacePct),
    frontHeightPct: pct(frontFacePct),
    depthSkewLeftPct: pct(Math.abs(depthSkewLeft)),
    depthSkewTopPct: pct(Math.abs(depthSkewTop)),
  };
}
