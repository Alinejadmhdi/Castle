import {
  getMacroStageForBrickValue,
  isNewStageUnlocked,
} from '../src/constants/buildings';
import { getDailyStructureForHours } from '../src/constants/dailyBuildings';
import { getCompoundProgress, getStageForBrickValue, getVisibleWallBricks } from '../src/features/progression/progressionService';
import { updateStreak } from '../src/features/streaks/streakService';
import { msToBrickValue, splitBrickValue } from '../src/utils';

describe('msToBrickValue', () => {
  it('converts 1 hour to 1 brick', () => {
    expect(msToBrickValue(3_600_000)).toBe(1);
  });

  it('converts 25 minutes to fractional brick', () => {
    expect(msToBrickValue(1_500_000)).toBeCloseTo(0.417, 2);
  });

  it('floors when fractional disabled', () => {
    expect(msToBrickValue(5_400_000, false)).toBe(1);
  });
});

describe('splitBrickValue', () => {
  it('splits 2 hours into two full bricks', () => {
    expect(splitBrickValue(2)).toEqual([1, 1]);
  });

  it('splits fractional remainder', () => {
    expect(splitBrickValue(1.5)).toEqual([1, 0.5]);
  });

  it('floors when fractional disabled', () => {
    expect(splitBrickValue(2.7, false)).toEqual([1, 1]);
  });
});

describe('macro stages', () => {
  it('returns foundation at 4 bricks', () => {
    expect(getMacroStageForBrickValue(4).key).toBe('foundation');
  });

  it('returns castle at 11000 bricks', () => {
    expect(getMacroStageForBrickValue(11000).key).toBe('castle');
  });

  it('detects stage unlock', () => {
    const unlocked = isNewStageUnlocked(11, 12);
    expect(unlocked?.key).toBe('low_wall');
  });
});

describe('daily structures', () => {
  it('returns null under 2 hours', () => {
    expect(getDailyStructureForHours(1.5)).toBeNull();
  });

  it('returns pavilion at 10+ hours', () => {
    expect(getDailyStructureForHours(10)?.key).toBe('day_pavilion');
  });
});

describe('compound progress', () => {
  it('tracks wings toward grand wing', () => {
    const p = getCompoundProgress(3, 320);
    expect(p.completedSubCount).toBe(3);
    expect(p.subsNeededForNextCompound).toBe(1);
  });

  it('completes compound at 4 subs', () => {
    const p = getCompoundProgress(4, 320);
    expect(p.completedCompoundCount).toBe(1);
    expect(p.completedSubCount).toBe(0);
  });
});

describe('streaks', () => {
  it('starts streak at 1 on first brick', () => {
    const r = updateStreak(null, 0, 0, '2026-07-02');
    expect(r.currentStreak).toBe(1);
  });

  it('increments on consecutive day', () => {
    const r = updateStreak('2026-07-01', 3, 3, '2026-07-02');
    expect(r.currentStreak).toBe(4);
  });

  it('awards label at day 3', () => {
    const r = updateStreak('2026-07-01', 2, 2, '2026-07-02');
    expect(r.rewardLabel).toBe(3);
    expect(r.isNewMilestone).toBe(true);
  });
});

describe('miniature stages', () => {
  it('uses the same ladder as focus categories', () => {
    expect(getStageForBrickValue(4, 'miniature').key).toBe('foundation');
    expect(getStageForBrickValue(4, 'standard').key).toBe('foundation');
  });

  it('detects miniature stage unlock at hut threshold', () => {
    const unlocked = isNewStageUnlocked(269, 270, 'miniature');
    expect(unlocked?.key).toBe('hut');
  });
});

describe('visible wall bricks', () => {
  const sampleBricks = [
    {
      id: '1',
      categoryId: 'c1',
      color: '#c00',
      sessionId: null,
      fractionalValue: 1,
      globalIndex: 1,
      stageIndex: 0,
      positionInStage: 1,
      dailyBuildId: null,
      buildingInstanceId: null,
      gridX: 0,
      gridY: 0,
      streakRewardLabel: null,
      completedAt: '',
      isMiniature: false,
    },
    {
      id: '2',
      categoryId: 'c1',
      color: '#c00',
      sessionId: null,
      fractionalValue: 1,
      globalIndex: 2,
      stageIndex: 1,
      positionInStage: 1,
      dailyBuildId: null,
      buildingInstanceId: null,
      gridX: 0,
      gridY: 0,
      streakRewardLabel: null,
      completedAt: '',
      isMiniature: false,
    },
  ] as const;

  it('hides bricks from completed stages after upgrade', () => {
    const visible = getVisibleWallBricks([...sampleBricks], 15, 'standard');
    expect(visible).toHaveLength(1);
    expect(visible[0].stageIndex).toBe(1);
  });

  it('hides absorbed bricks linked to a building', () => {
    const absorbed = { ...sampleBricks[1], buildingInstanceId: 'bld-1' };
    const visible = getVisibleWallBricks([sampleBricks[0], absorbed], 15, 'standard');
    expect(visible).toHaveLength(0);
  });
});
