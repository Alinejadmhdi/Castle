import {
  filterTreesForBuildings,
  generateForestTrees,
} from '../src/rendering/three/forestLayout';

describe('forestLayout', () => {
  it('generates many scattered trees', () => {
    const trees = generateForestTrees(1, 30);
    expect(trees.length).toBeGreaterThanOrEqual(180);
  });

  it('removes trees where a building is placed', () => {
    const trees = generateForestTrees(1, 30);
    const slot = { plotX: trees[0].x, plotY: trees[0].z };
    const filtered = filterTreesForBuildings(trees, [slot], 1, 3);
    expect(filtered.length).toBeLessThan(trees.length);
  });
});
