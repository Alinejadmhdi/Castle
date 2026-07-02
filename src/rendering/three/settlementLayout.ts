import type { BuildingInstance } from '@/types';
import { MACRO_BUILDING_STAGES } from '@/constants/buildings';
import { MINIATURE_BUILDING_STAGES } from '@/constants/miniatureBuildings';
import { BUILDING_VISUAL_SCALE, RING_MONUMENT_VISUAL_SCALE } from '@/components/map/three/coc/cocPalette';

const SLOT_GAP = 2.5;

/** Monument ring outside the inner dirt pad, inside the forest. */
const MONUMENT_RING_SLOTS: { plotX: number; plotY: number }[] = (() => {
  const slots: { plotX: number; plotY: number }[] = [];
  const rings = [
    { radius: 22, count: 6 },
    { radius: 28, count: 8 },
    { radius: 34, count: 10 },
    { radius: 40, count: 12 },
  ];
  for (const { radius, count } of rings) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 4;
      slots.push({
        plotX: Math.cos(angle) * radius,
        plotY: Math.sin(angle) * radius * 0.72,
      });
    }
  }
  return slots;
})();

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
  const meshScale = buildingScale * 0.68;
  const baseWidth = meshScale * BUILDING_VISUAL_SCALE * 2.8;

  let widthMul = 1.05;
  if (stageIndex >= 20) widthMul = 2.35;
  else if (stageIndex >= 14) widthMul = 1.8;
  else if (stageIndex >= 10) widthMul = 1.38;

  const halfW = (baseWidth * widthMul) / 2;
  const padded = halfW * 1.25;
  return Math.max(isMiniature ? 6 : 14, padded);
}

/** Footprint for scattered ring monuments (small meshes). */
export function getRingMonumentFootprintRadius(
  buildingScale: number,
  isMiniature: boolean,
  stageIndex: number,
): number {
  const meshScale = buildingScale * RING_MONUMENT_VISUAL_SCALE;
  const baseWidth = meshScale * BUILDING_VISUAL_SCALE * 2.4;

  let widthMul = 1.05;
  if (stageIndex >= 20) widthMul = 1.65;
  else if (stageIndex >= 14) widthMul = 1.45;
  else if (stageIndex >= 10) widthMul = 1.2;

  const halfW = (baseWidth * widthMul) / 2;
  return Math.max(isMiniature ? 3.5 : 5, halfW * 1.15);
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
  return distance(ax, ay, bx, by) < ar + br + SLOT_GAP;
}

export interface ReservedMonument {
  plotX: number;
  plotY: number;
  radius: number;
}

function toReserved(building: BuildingInstance): ReservedMonument {
  const isMini = building.kind === 'miniature';
  const stageIndex = getBuildingStageIndex(building);
  const isRingMonument = building.kind === 'macro' || building.kind === 'miniature';
  const radius = isRingMonument
    ? getRingMonumentFootprintRadius(building.scale, isMini, stageIndex)
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
): { plotX: number; plotY: number } {
  for (const slot of MONUMENT_RING_SLOTS) {
    if (slotIsFree(slot.plotX, slot.plotY, radius, reserved)) {
      return slot;
    }
  }

  const rng = seededRandom(hashString(`${categoryId}:fallback:${buildingIndex}:${reserved.length}`));
  for (let attempt = 0; attempt < 80; attempt++) {
    const angle = rng() * Math.PI * 2;
    const ring = 32 + Math.floor(attempt / 12) * 14;
    const plotX = Math.cos(angle) * ring;
    const plotY = Math.sin(angle) * ring * 0.72;
    if (slotIsFree(plotX, plotY, radius, reserved)) {
      return { plotX, plotY };
    }
  }

  const angle = buildingIndex * 1.1;
  const ring = 34 + buildingIndex * 8;
  return {
    plotX: Math.cos(angle) * ring,
    plotY: Math.sin(angle) * ring * 0.72,
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
): { plotX: number; plotY: number } {
  const radius = getRingMonumentFootprintRadius(buildingScale, isMiniature, stageIndex);
  const reserved = existing.map((b) => toReserved(b));
  return pickFreeSlot(radius, reserved, buildingIndex, categoryId);
}

/** Fix overlaps in unlock order; keeps valid positions, reassigns colliding ones. */
export function reconcileMonumentLayout(
  monuments: BuildingInstance[],
): Map<string, { plotX: number; plotY: number }> {
  const sorted = [...monuments].sort((a, b) => a.unlockedAt.localeCompare(b.unlockedAt));
  const placed: ReservedMonument[] = [];
  const result = new Map<string, { plotX: number; plotY: number }>();

  sorted.forEach((building, index) => {
    const isMini = building.kind === 'miniature';
    const stageIndex = getBuildingStageIndex(building);
    const radius = getRingMonumentFootprintRadius(building.scale, isMini, stageIndex);

    let plotX = building.plotX;
    let plotY = building.plotY;

    if (!slotIsFree(plotX, plotY, radius, placed)) {
      const slot = pickFreeSlot(radius, placed, index, building.categoryId);
      plotX = slot.plotX;
      plotY = slot.plotY;
    }

    placed.push({ plotX, plotY, radius });
    result.set(building.id, { plotX, plotY });
  });

  return result;
}

/** Reconcile overlaps and return layout for rendering. */
export function layoutMonuments(
  monuments: BuildingInstance[],
): Map<string, { plotX: number; plotY: number }> {
  return reconcileMonumentLayout(monuments);
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
