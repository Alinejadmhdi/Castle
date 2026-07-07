import {
  resolveBrickDisplayColor,
  wallBrickDisplayColor,
} from '../src/utils/brickColor';

describe('wallBrickDisplayColor', () => {
  const color = '#c45c3a';

  it('alternates base → darker by placement index', () => {
    expect(wallBrickDisplayColor(color, 0)).toBe(resolveBrickDisplayColor(color));
    expect(wallBrickDisplayColor(color, 1)).not.toBe(resolveBrickDisplayColor(color));
    expect(wallBrickDisplayColor(color, 2)).toBe(resolveBrickDisplayColor(color));
    expect(wallBrickDisplayColor(color, 3)).not.toBe(resolveBrickDisplayColor(color));
  });
});
