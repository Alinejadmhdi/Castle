import { plotSlotToWorld } from './settlementLayout';

export interface ForestTree {
  id: string;
  x: number;
  z: number;
  scale: number;
  kind: 'tree' | 'bush';
  variant: 0 | 1 | 2;
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

/** Visible half-extent of map + pine border (world units). */
export function getMapViewHalfExtent(groundHalf: number): number {
  return groundHalf * 1.55;
}

/**
 * Dense CoC-style pines in the forest ring and scattered on inner grass.
 */
export function generateForestTrees(plotScale: number, groundHalf: number): ForestTree[] {
  const rng = seededRandom(Math.floor(plotScale * 10007));
  const trees: ForestTree[] = [];
  let id = 0;

  const add = (x: number, z: number, scale: number, kind: 'tree' | 'bush', variant: 0 | 1 | 2) => {
    trees.push({ id: `t${id++}`, x, z, scale, kind, variant });
  };

  const outerRingInner = groundHalf * 1.02;
  const outerRingOuter = groundHalf * 1.48;
  const ringCount = 140;

  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2 + (rng() - 0.5) * 0.35;
    const radius = outerRingInner + rng() * (outerRingOuter - outerRingInner);
    add(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      (0.32 + rng() * 0.42) * plotScale,
      rng() > 0.88 ? 'bush' : 'tree',
      Math.floor(rng() * 3) as 0 | 1 | 2,
    );
  }

  const innerGrass = groundHalf * 0.48;
  const innerCount = 72;
  for (let i = 0; i < innerCount; i++) {
    const angle = rng() * Math.PI * 2;
    const radius = groundHalf * 0.55 + rng() * (innerGrass - groundHalf * 0.55);
    add(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      (0.28 + rng() * 0.35) * plotScale,
      rng() > 0.9 ? 'bush' : 'tree',
      Math.floor(rng() * 3) as 0 | 1 | 2,
    );
  }

  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];
  for (const [sx, sz] of corners) {
    for (let j = 0; j < 12; j++) {
      const angle = Math.atan2(sz, sx) + (rng() - 0.5) * 0.85;
      const radius = outerRingOuter * (0.92 + rng() * 0.18);
      add(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        (0.38 + rng() * 0.5) * plotScale,
        'tree',
        Math.floor(rng() * 3) as 0 | 1 | 2,
      );
    }
  }

  return trees;
}

/** Remove trees where a monument is placed (building clears its tile). */
export function filterTreesForBuildings(
  trees: ForestTree[],
  buildingSlots: { plotX: number; plotY: number }[],
  plotScale: number,
  clearRadiusPlot = 2.75,
): ForestTree[] {
  if (buildingSlots.length === 0) return trees;

  const clearR = clearRadiusPlot * plotScale;
  const centers = buildingSlots.map((s) => plotSlotToWorld(s.plotX, s.plotY, plotScale));

  return trees.filter((tree) => {
    for (const center of centers) {
      const dx = tree.x - center.x;
      const dz = tree.z - center.z;
      if (dx * dx + dz * dz < clearR * clearR) return false;
    }
    return true;
  });
}
