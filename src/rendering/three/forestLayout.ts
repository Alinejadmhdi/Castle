import { getGroundDimensions } from '@/rendering/three/gridToWorld';
import { plotSlotToWorld } from '@/rendering/three/settlementLayout';

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

const TREE_SCALE_MULTIPLIER = 3;

/**
 * Randomly scattered CoC pines — no ring/grid ordering.
 */
export function generateForestTrees(plotScale: number, groundHalf: number): ForestTree[] {
  const rng = seededRandom(Math.floor(plotScale * 10007 + groundHalf * 31));
  const trees: ForestTree[] = [];
  let id = 0;

  const add = (x: number, z: number, scale: number, kind: 'tree' | 'bush', variant: 0 | 1 | 2) => {
    trees.push({
      id: `t${id++}`,
      x,
      z,
      scale: scale * TREE_SCALE_MULTIPLIER,
      kind,
      variant,
    });
  };

  const extent = getMapViewHalfExtent(groundHalf);
  const innerClear = groundHalf * 0.42;
  const targetCount = 220;

  for (let attempts = 0; attempts < targetCount * 8 && trees.length < targetCount; attempts++) {
    const x = (rng() * 2 - 1) * extent * 0.98;
    const z = (rng() * 2 - 1) * extent * 0.98;
    const dist = Math.hypot(x, z);

    if (dist < innerClear) continue;
    if (dist > extent * 0.96) continue;

    const edgeBias = (dist - innerClear) / (extent - innerClear);
    const scale =
      (0.22 + rng() * 0.38 + edgeBias * 0.18) * plotScale * (rng() > 0.82 ? 1.15 : 1);

    add(
      x + (rng() - 0.5) * plotScale * 0.6,
      z + (rng() - 0.5) * plotScale * 0.6,
      scale,
      rng() > 0.86 ? 'bush' : 'tree',
      Math.floor(rng() * 3) as 0 | 1 | 2,
    );
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
