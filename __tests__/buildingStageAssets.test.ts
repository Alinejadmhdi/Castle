import {
  BUILDING_STAGE_COUNT,
  BUILDING_STAGE_IMAGES,
} from '@/constants/buildingPreviewAssets';
import { MACRO_BUILDING_STAGES } from '@/constants/buildings';
import { normalizeStageIndex } from '@/constants/buildingPreviewAssets';

describe('building stage assets', () => {
  it('has one PNG per macro stage', () => {
    expect(BUILDING_STAGE_COUNT).toBe(27);
    expect(BUILDING_STAGE_IMAGES).toHaveLength(MACRO_BUILDING_STAGES.length);
  });

  it('clamps out-of-range indices', () => {
    expect(normalizeStageIndex(-1)).toBe(0);
    expect(normalizeStageIndex(99)).toBe(26);
  });
});
