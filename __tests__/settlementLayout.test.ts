import {
  getLatestRingMonument,
  getMonumentFootprintRadius,
  getMonumentPlotSlot,
  getRingMonumentFootprintRadius,
  reconcileMonumentLayout,
} from '../src/rendering/three/settlementLayout';
import {
  MACRO_MONUMENT_FROM_STAGE_INDEX,
  MINIATURE_MONUMENT_FROM_STAGE_INDEX,
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
  it('uses large footprints for scale-12 monuments', () => {
    const hutRadius = getMonumentFootprintRadius(1, false, 9);
    expect(hutRadius).toBeGreaterThan(14);
    const castleRadius = getMonumentFootprintRadius(1, false, 26);
    expect(castleRadius).toBeGreaterThan(hutRadius);
  });

  it('places second monument far from the first', () => {
    const first = monument({ id: 'a', plotX: 22, plotY: 0, stageKey: 'hut' });
    const secondSlot = getMonumentPlotSlot(1, 'cat1', [first], 1, false, 9);
    const r = getRingMonumentFootprintRadius(1, false, 9);
    const d = Math.hypot(secondSlot.plotX - first.plotX, secondSlot.plotY - first.plotY);
    expect(d).toBeGreaterThanOrEqual(r * 2);
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

  it('reconcileMonumentLayout separates stacked monuments', () => {
    const a = monument({ id: 'a', plotX: 0, plotY: 0, unlockedAt: '2026-01-01T00:00:00.000Z' });
    const b = monument({
      id: 'b',
      plotX: 0,
      plotY: 0,
      stageKey: 'cottage',
      unlockedAt: '2026-01-02T00:00:00.000Z',
    });
    const layout = reconcileMonumentLayout([a, b]);
    const slotA = layout.get('a')!;
    const slotB = layout.get('b')!;
    const rA = getRingMonumentFootprintRadius(1, false, 9);
    const rB = getRingMonumentFootprintRadius(1, false, 10);
    const d = Math.hypot(slotA.plotX - slotB.plotX, slotA.plotY - slotB.plotY);
    expect(d).toBeGreaterThanOrEqual(rA + rB);
  });
});

describe('monumentPersistence', () => {
  it('miniature monuments from birdhouse onward', () => {
    expect(MINIATURE_MONUMENT_FROM_STAGE_INDEX).toBe(3);
    expect(shouldPersistStageMonument('miniature', 2)).toBe(false);
    expect(shouldPersistStageMonument('miniature', 3)).toBe(true);
  });

  it('macro monuments from hut onward', () => {
    expect(MACRO_MONUMENT_FROM_STAGE_INDEX).toBe(9);
    expect(shouldPersistStageMonument('standard', 8)).toBe(false);
    expect(shouldPersistStageMonument('standard', 9)).toBe(true);
  });
});
