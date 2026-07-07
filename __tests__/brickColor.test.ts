import {
  resolveBrickDisplayColor,
  wallBrickDisplayColor,
} from '../src/utils/brickColor';

describe('wallBrickDisplayColor', () => {
  const color = '#c45c3a';

  it('alternates along columns on a row', () => {
    expect(wallBrickDisplayColor(color, 0, 0)).toBe(resolveBrickDisplayColor(color));
    expect(wallBrickDisplayColor(color, 1, 0)).not.toBe(resolveBrickDisplayColor(color));
    expect(wallBrickDisplayColor(color, 2, 0)).toBe(resolveBrickDisplayColor(color));
  });

  it('alternates along rows in a column', () => {
    expect(wallBrickDisplayColor(color, 0, 0)).toBe(resolveBrickDisplayColor(color));
    expect(wallBrickDisplayColor(color, 0, 1)).not.toBe(resolveBrickDisplayColor(color));
    expect(wallBrickDisplayColor(color, 0, 2)).toBe(resolveBrickDisplayColor(color));
  });

  it('keeps horizontal and vertical neighbors on opposite colors', () => {
    expect(wallBrickDisplayColor(color, 0, 0)).not.toBe(wallBrickDisplayColor(color, 1, 0));
    expect(wallBrickDisplayColor(color, 0, 0)).not.toBe(wallBrickDisplayColor(color, 0, 1));
  });
});
