import type { BuildingInstance } from '@/types';
import { MACRO_BUILDING_STAGES } from '@/constants/buildings';
import { MINIATURE_BUILDING_STAGES } from '@/constants/miniatureBuildings';
import { hqSpriteSizeScale, spriteSizeScale, SPRITE_BASE_WIDTH } from '@/components/map/three/coc/cocPalette';
import { HQ_LAYOUT, RING_LAYOUT } from '@/rendering/three/mapContentLayout';
import { gridToWorldPosition } from '@/rendering/three/gridToWorld';
import { ringMonumentPlotFootprintRadius } from '@/rendering/three/ringBuildingScale';

function slotGap(): number {
  return RING_LAYOUT.slotGap;
}

export interface RingPlacementBounds {
  minRadius: number;
  maxRadius: number;
  hqX: number;
  hqY: number;
}

/** Ring band from HQ edge to near the wall — full span for monument spread. */
export function getRingPlacementBounds(
  plotScale = 1,
  hqStageIndex = 16,
  monumentRadius = 5,
): RingPlacementBounds {
  const wallZ = gridToWorldPosition(0, 0, 1, plotScale).z / plotScale;
  const hqX = HQ_LAYOUT.worldX;
  const hqY = HQ_LAYOUT.worldZ;
  const span = Math.max(8, wallZ - hqY);
  const hqFootprint = getHqPlotFootprintRadius(false, hqStageIndex);
  const minRadius = Math.max(
    hqFootprint + monumentRadius + slotGap() + RING_LAYOUT.minRadiusPad,
    hqFootprint + RING_LAYOUT.minRadiusPad + 3,
  );
  const maxFromWall = span - RING_LAYOUT.wallInset;
  const maxFromFactor = span * RING_LAYOUT.placementMaxSpanFactor;
  const maxRadius = Math.max(minRadius + 4, Math.min(maxFromWall, maxFromFactor));
  return { minRadius, maxRadius, hqX, hqY };
}

/** Replaceable early-wall monument — just outside HQ in the inner ring band. */
export function getEarlyRingSlot(plotScale = 1, hqStageIndex = 9): { plotX: number; plotY: number } {
  const { minRadius, hqX, hqY } = getRingPlacementBounds(plotScale, hqStageIndex);
  const angle = -Math.PI / 5;
  return {
    plotX: hqX + Math.cos(angle) * minRadius,
    plotY: hqY + Math.sin(angle) * minRadius * 0.72,
  };
}

/** @deprecated Use getRingPlacementBounds().maxRadius */
export function getRingMaxPlotRadius(plotScale = 1, hqStageIndex = 16): number {
  return getRingPlacementBounds(plotScale, hqStageIndex).maxRadius;
}

function buildMonumentRingSlots(bounds: RingPlacementBounds): { plotX: number; plotY: number }[] {
  const { minRadius, maxRadius, hqX, hqY } = bounds;
  const slots: { plotX: number; plotY: number }[] = [];
  const ringDefs = [
    { t: 0, count: 6, angleOffset: 0 },
    { t: 0.45, count: 8, angleOffset: Math.PI / 10 },
    { t: 0.72, count: 10, angleOffset: Math.PI / 7 },
    { t: 1, count: 12, angleOffset: Math.PI / 5 },
  ];
  for (const { t, count, angleOffset } of ringDefs) {
    const radius = minRadius + t * (maxRadius - minRadius);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 4 + angleOffset;
      slots.push({
        plotX: hqX + Math.cos(angle) * radius,
        plotY: hqY + Math.sin(angle) * radius * 0.72,
      });
    }
  }
  return slots;
}

function monumentRingSlotsForPlot(
  plotScale = 1,
  hqStageIndex = 16,
  monumentRadius = 5,
): { plotX: number; plotY: number }[] {
  return buildMonumentRingSlots(getRingPlacementBounds(plotScale, hqStageIndex, monumentRadius));
}

function distanceFromHq(plotX: number, plotY: number, bounds: RingPlacementBounds): number {
  const dx = plotX - bounds.hqX;
  const dy = plotY - bounds.hqY;
  return Math.sqrt(dx * dx + dy * dy);
}

function slotWithinRingBand(
  plotX: number,
  plotY: number,
  bounds: RingPlacementBounds,
): boolean {
  const d = distanceFromHq(plotX, plotY, bounds);
  return d >= bounds.minRadius * 0.9 && d <= bounds.maxRadius * 1.05;
}

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getBuildingStageIndex(building: BuildingInstance): number {
  const stages =
    building.kind === 'miniature' ? MINIATURE_BUILDING_STAGES : MACRO_BUILDING_STAGES;
  return stages.find((s) => s.key === building.stageKey)?.index ?? 0;
}

/**
 * Ground footprint radius in plot coordinates (matches CoCBuildingModel width).
 * plotScale is NOT included — plotX/plotY are pre-scale slot coords.
 */
export function getMonumentFootprintRadius(
  buildingScale: number,
  isMiniature: boolean,
  stageIndex: number,
): number {
  const baseWidth = isMiniature ? SPRITE_BASE_WIDTH.miniature : SPRITE_BASE_WIDTH.standard;
  const sizeScale = hqSpriteSizeScale(isMiniature, stageIndex);
  const width = buildingScale * baseWidth * sizeScale;
  return Math.max(isMiniature ? 6 : 14, width * 0.48);
}

/** Footprint for scattered ring monuments (layout collision). */
export function getRingMonumentFootprintRadius(
  buildingScale: number,
  isMiniature: boolean,
  stageIndex: number,
  hqStageIndex = 15,
): number {
  return ringMonumentPlotFootprintRadius(
    buildingScale,
    isMiniature,
    stageIndex,
    hqStageIndex,
  );
}

/** HQ plot footprint — reserves center so ring monuments stay outside. */
export function getHqPlotFootprintRadius(isMiniature = false, stageIndex = 16): number {
  const baseWidth = isMiniature ? SPRITE_BASE_WIDTH.miniature : SPRITE_BASE_WIDTH.standard;
  const sizeScale = spriteSizeScale(false, isMiniature, stageIndex);
  return baseWidth * sizeScale * 0.48;
}

function getHqReservedMonument(hqStageIndex = 16): ReservedMonument {
  return {
    plotX: HQ_LAYOUT.worldX,
    plotY: HQ_LAYOUT.worldZ,
    radius: getHqPlotFootprintRadius(false, hqStageIndex),
  };
}

/** Half-extent of the monument scatter ring — for camera framing. */
export function getMonumentRingHalfExtent(groundHalf: number): number {
  return groundHalf * 1.42;
}

function circlesOverlap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  return distance(ax, ay, bx, by) < ar + br + slotGap();
}

export function monumentsOverlap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  return circlesOverlap(ax, ay, ar, bx, by, br);
}

export interface ReservedMonument {
  plotX: number;
  plotY: number;
  radius: number;
}

function toReserved(building: BuildingInstance, hqStageIndex = 16): ReservedMonument {
  const isMini = building.kind === 'miniature';
  const stageIndex = getBuildingStageIndex(building);
  const isRingMonument = building.kind === 'macro' || building.kind === 'miniature';
  const radius = isRingMonument
    ? getRingMonumentFootprintRadius(building.scale, isMini, stageIndex, hqStageIndex)
    : getMonumentFootprintRadius(building.scale, isMini, stageIndex);
  return {
    plotX: building.plotX,
    plotY: building.plotY,
    radius,
  };
}

function slotIsFree(
  plotX: number,
  plotY: number,
  radius: number,
  reserved: ReservedMonument[],
): boolean {
  return reserved.every(
    (r) => !circlesOverlap(plotX, plotY, radius, r.plotX, r.plotY, r.radius),
  );
}

function pickFreeSlot(
  radius: number,
  reserved: ReservedMonument[],
  buildingIndex: number,
  categoryId: string,
  plotScale = 1,
  hqStageIndex = 16,
): { plotX: number; plotY: number } {
  const bounds = getRingPlacementBounds(plotScale, hqStageIndex, radius);
  const allSlots = monumentRingSlotsForPlot(plotScale, hqStageIndex, radius);
  const byDist = [...allSlots].sort(
    (a, b) =>
      distanceFromHq(a.plotX, a.plotY, bounds) - distanceFromHq(b.plotX, b.plotY, bounds),
  );
  const tierCount = 4;
  const tier = buildingIndex % tierCount;
  const perTier = Math.max(1, Math.ceil(byDist.length / tierCount));
  const start = tier * perTier;
  const tierSlots = byDist.slice(start, start + perTier);
  const tierSet = new Set(tierSlots);
  const searchOrder = [...tierSlots, ...byDist.filter((s) => !tierSet.has(s))];

  for (const slot of searchOrder) {
    if (slotIsFree(slot.plotX, slot.plotY, radius, reserved)) {
      return slot;
    }
  }

  const maxR = bounds.maxRadius - radius * 0.25;
  const minR = bounds.minRadius;
  const rng = seededRandom(hashString(`${categoryId}:fallback:${buildingIndex}:${reserved.length}`));
  for (let attempt = 0; attempt < 160; attempt++) {
    const angle = attempt * 0.55 + rng() * 0.3;
    const t = (attempt % 30) / 29;
    const ring = minR + t * Math.max(0.5, maxR - minR);
    const plotX = bounds.hqX + Math.cos(angle) * ring;
    const plotY = bounds.hqY + Math.sin(angle) * ring * 0.72;
    if (
      slotWithinRingBand(plotX, plotY, bounds) &&
      slotIsFree(plotX, plotY, radius, reserved)
    ) {
      return { plotX, plotY };
    }
  }

  for (let i = 0; i < 45; i++) {
    const angle = buildingIndex * 0.95 + i * (Math.PI * 2) / 45;
    for (let t = 0; t <= 4; t++) {
      const ring = minR + (t / 4) * Math.max(0.5, maxR - minR);
      const plotX = bounds.hqX + Math.cos(angle) * ring;
      const plotY = bounds.hqY + Math.sin(angle) * ring * 0.72;
      if (slotIsFree(plotX, plotY, radius, reserved)) {
        return { plotX, plotY };
      }
    }
  }

  for (let ti = 0; ti <= 24; ti++) {
    const t = ti / 24;
    const ring = minR + t * Math.max(0.5, maxR - minR);
    for (let ai = 0; ai < 48; ai++) {
      const angle = (ai / 48) * Math.PI * 2 + buildingIndex * 0.31;
      const plotX = bounds.hqX + Math.cos(angle) * ring;
      const plotY = bounds.hqY + Math.sin(angle) * ring * 0.72;
      if (slotIsFree(plotX, plotY, radius, reserved)) {
        return { plotX, plotY };
      }
    }
  }

  const angle = buildingIndex * (Math.PI * 2) / 7;
  return {
    plotX: bounds.hqX + Math.cos(angle) * maxR,
    plotY: bounds.hqY + Math.sin(angle) * maxR * 0.72,
  };
}

/**
 * Pick a non-overlapping plot slot; reserves space using footprint circles.
 */
export function getMonumentPlotSlot(
  buildingIndex: number,
  categoryId: string,
  existing: BuildingInstance[] = [],
  buildingScale = 1,
  isMiniature = false,
  stageIndex = 9,
  plotScale = 1,
  hqStageIndex = 16,
): { plotX: number; plotY: number } {
  const radius = getRingMonumentFootprintRadius(
    buildingScale,
    isMiniature,
    stageIndex,
    hqStageIndex,
  );
  const reserved = [getHqReservedMonument(hqStageIndex), ...existing.map((b) => toReserved(b, hqStageIndex))];
  return pickFreeSlot(radius, reserved, buildingIndex, categoryId, plotScale, hqStageIndex);
}

/** Fix overlaps in unlock order; keeps valid positions, reassigns colliding ones. */
export function reconcileMonumentLayout(
  monuments: BuildingInstance[],
  hqStageIndex = 16,
  plotScale = 1,
): Map<string, { plotX: number; plotY: number }> {
  const sorted = [...monuments].sort((a, b) => a.unlockedAt.localeCompare(b.unlockedAt));
  const placed: ReservedMonument[] = [getHqReservedMonument(hqStageIndex)];
  const result = new Map<string, { plotX: number; plotY: number }>();

  sorted.forEach((building, index) => {
    const isMini = building.kind === 'miniature';
    const stageIndex = getBuildingStageIndex(building);
    const radius = getRingMonumentFootprintRadius(
      building.scale,
      isMini,
      stageIndex,
      hqStageIndex,
    );

    const slot = pickFreeSlot(
      radius,
      placed,
      index,
      building.categoryId,
      plotScale,
      hqStageIndex,
    );
    const plotX = slot.plotX;
    const plotY = slot.plotY;

    placed.push({ plotX, plotY, radius });
    result.set(building.id, { plotX, plotY });
  });

  return result;
}

/** Reconcile overlaps and return layout for rendering. */
export function layoutMonuments(
  monuments: BuildingInstance[],
  hqStageIndex = 16,
  plotScale = 1,
): Map<string, { plotX: number; plotY: number }> {
  return reconcileMonumentLayout(monuments, hqStageIndex, plotScale);
}

export function plotSlotToWorld(
  plotX: number,
  plotY: number,
  plotScale: number,
): { x: number; z: number } {
  return {
    x: plotX * plotScale,
    z: plotY * plotScale,
  };
}

/** Fixed ring slot — legacy; prefer scattered MONUMENT_RING_SLOTS. */
export const RING_MONUMENT_SLOT = { plotX: 22, plotY: -15.8 };

/** Max footprint radius in a monument set — for tree clearing. */
export function getMaxMonumentFootprintRadius(monuments: BuildingInstance[]): number {
  if (monuments.length === 0) return 0;
  return Math.max(
    ...monuments.map((b) =>
      getRingMonumentFootprintRadius(
        b.scale,
        b.kind === 'miniature',
        getBuildingStageIndex(b),
      ),
    ),
  );
}

/** One ring monument — the highest completed stage currently on the plot. */
export function getLatestRingMonument(
  monuments: BuildingInstance[],
): BuildingInstance | null {
  if (monuments.length === 0) return null;
  return monuments.reduce((latest, building) =>
    getBuildingStageIndex(building) > getBuildingStageIndex(latest) ? building : latest,
  );
}
