import {
  getLatestRingMonument,
  getHqPlotFootprintRadius,
  getMonumentFootprintRadius,
  getMonumentPlotSlot,
  getRingPlacementBounds,
  getRingMonumentFootprintRadius,
  monumentsOverlap,
  reconcileMonumentLayout,
} from '../src/rendering/three/settlementLayout';
import { gridToWorldPosition } from '../src/rendering/three/gridToWorld';
import {
  MACRO_MONUMENT_FROM_STAGE_INDEX,
  MINIATURE_MONUMENT_FROM_STAGE_INDEX,
  shouldDisplayPlotMonument,
  shouldPersistStageMonument,
} from '../src/constants/monumentPersistence';
import type { BuildingInstance } from '../src/types';

function monument(partial: Partial<BuildingInstance> & Pick<BuildingInstance, 'id'>): BuildingInstance {
  return {
    categoryId: 'cat1',
    kind: 'macro',
    stageKey: 'hut',
    name: 'Hut',
    brickIds: [],
    totalBrickValue: 270,
    plotX: 0,
    plotY: 0,
    scale: 1,
    unlockedAt: '2026-01-01T00:00:00.000Z',
    parentCompoundId: null,
    sourceInstanceIds: [],
    ...partial,
  };
}

describe('settlementLayout', () => {
  it('uses sprite-aligned footprints that grow with stage', () => {
    const hutRadius = getMonumentFootprintRadius(1, false, 9);
    expect(hutRadius).toBeGreaterThan(8);
    const castleRadius = getMonumentFootprintRadius(1, false, 26);
    expect(castleRadius).toBeGreaterThan(hutRadius);
  });

  it('places second monument far from the first', () => {
    const hqStage = 12;
    const first = monument({ id: 'a', plotX: 22, plotY: 0, stageKey: 'hut' });
    const secondSlot = getMonumentPlotSlot(1, 'cat1', [first], 1, false, 9, 1, hqStage);
    const r = getRingMonumentFootprintRadius(1, false, 9, hqStage);
    const d = Math.hypot(secondSlot.plotX - first.plotX, secondSlot.plotY - first.plotY);
    expect(d).toBeGreaterThanOrEqual(r * 1.2);
  });

  it('uses most of the HQ–wall span for ring placement', () => {
    const hqStage = 12;
    const monumentStage = 9;
    const monumentRadius = getRingMonumentFootprintRadius(1, false, monumentStage, hqStage);
    const bounds = getRingPlacementBounds(1, hqStage, monumentRadius);
    const wallZ = gridToWorldPosition(0, 0, 1, 1).z;
    const span = wallZ - bounds.hqY;
    expect(bounds.maxRadius).toBeGreaterThan(span * 0.75);
    const slot = getMonumentPlotSlot(0, 'cat1', [], 1, false, monumentStage, 1, hqStage);
    const distFromHq = Math.hypot(slot.plotX - bounds.hqX, slot.plotY - bounds.hqY);
    expect(distFromHq).toBeLessThanOrEqual(bounds.maxRadius + 0.5);
    expect(distFromHq).toBeGreaterThanOrEqual(bounds.minRadius * 0.85);
  });

  it('getLatestRingMonument returns highest stage only', () => {
    const a = monument({ id: 'a', stageKey: 'hut', unlockedAt: '2026-01-01T00:00:00.000Z' });
    const b = monument({
      id: 'b',
      stageKey: 'cottage',
      unlockedAt: '2026-01-02T00:00:00.000Z',
    });
    expect(getLatestRingMonument([a, b])?.stageKey).toBe('cottage');
    expect(getLatestRingMonument([a])).toBe(a);
    expect(getLatestRingMonument([])).toBeNull();
  });

  it('reconcileMonumentLayout keeps monuments outside HQ footprint', () => {
    const hqStage = 12;
    const hqRadius = getHqPlotFootprintRadius(false, hqStage);
    const a = monument({ id: 'a', plotX: 0, plotY: 0, unlockedAt: '2026-01-01T00:00:00.000Z' });
    const layout = reconcileMonumentLayout([a], hqStage);
    const slotA = layout.get('a')!;
    const d = Math.hypot(slotA.plotX, slotA.plotY - 0.75);
    expect(d).toBeGreaterThanOrEqual(hqRadius);
  });

  it('reconcileMonumentLayout separates stacked monuments', () => {
    const hqStage = 12;
    const a = monument({ id: 'a', plotX: 0, plotY: 0, unlockedAt: '2026-01-01T00:00:00.000Z' });
    const b = monument({
      id: 'b',
      plotX: 0,
      plotY: 0,
      stageKey: 'cottage',
      unlockedAt: '2026-01-02T00:00:00.000Z',
    });
    const layout = reconcileMonumentLayout([a, b], hqStage);
    const slotA = layout.get('a')!;
    const slotB = layout.get('b')!;
    const rA = getRingMonumentFootprintRadius(1, false, 9, hqStage);
    const rB = getRingMonumentFootprintRadius(1, false, 10, hqStage);
    expect(
      monumentsOverlap(slotA.plotX, slotA.plotY, rA, slotB.plotX, slotB.plotY, rB),
    ).toBe(false);
  });

  it('reconcileMonumentLayout never overlaps four monuments', () => {
    const hqStage = 14;
    const items = [
      monument({ id: 'a', stageKey: 'garden_enclosure', unlockedAt: '2026-01-01T00:00:00.000Z' }),
      monument({ id: 'b', stageKey: 'hut', unlockedAt: '2026-01-02T00:00:00.000Z' }),
      monument({ id: 'c', stageKey: 'cottage', unlockedAt: '2026-01-03T00:00:00.000Z' }),
      monument({ id: 'd', stageKey: 'house', unlockedAt: '2026-01-04T00:00:00.000Z' }),
    ];
    const layout = reconcileMonumentLayout(items, hqStage);
    const placed = items.map((b) => {
      const slot = layout.get(b.id)!;
      const stageIndex =
        b.stageKey === 'garden_enclosure'
          ? 6
          : b.stageKey === 'hut'
            ? 9
            : b.stageKey === 'cottage'
              ? 10
              : 13;
      return {
        ...slot,
        r: getRingMonumentFootprintRadius(1, false, stageIndex, hqStage),
      };
    });
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        expect(
          monumentsOverlap(
            placed[i].plotX,
            placed[i].plotY,
            placed[i].r,
            placed[j].plotX,
            placed[j].plotY,
            placed[j].r,
          ),
        ).toBe(false);
      }
    }
  });
});

describe('monumentPersistence', () => {
  it('miniature monuments from garden enclosure (stage 6) onward', () => {
    expect(MINIATURE_MONUMENT_FROM_STAGE_INDEX).toBe(6);
    expect(shouldPersistStageMonument('miniature', 5)).toBe(false);
    expect(shouldPersistStageMonument('miniature', 6)).toBe(true);
  });

  it('macro monuments from garden enclosure (stage 6) onward', () => {
    expect(MACRO_MONUMENT_FROM_STAGE_INDEX).toBe(6);
    expect(shouldPersistStageMonument('standard', 5)).toBe(false);
    expect(shouldPersistStageMonument('standard', 6)).toBe(true);
  });

  it('hides early replace monuments after stage 5', () => {
    expect(shouldDisplayPlotMonument('standard', 'foundation', 3)).toBe(true);
    expect(shouldDisplayPlotMonument('standard', 'foundation', 8)).toBe(false);
    expect(shouldDisplayPlotMonument('standard', 'garden_enclosure', 8)).toBe(true);
  });

  it('hides the active HQ stage from the ring', () => {
    expect(shouldDisplayPlotMonument('standard', 'hut', 9)).toBe(false);
    expect(shouldDisplayPlotMonument('standard', 'hut', 10)).toBe(true);
    expect(shouldDisplayPlotMonument('standard', 'shack', 9)).toBe(true);
  });
});
