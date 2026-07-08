import type { Category } from '@/types';
import { summarizeTodayGoals } from '@/features/stats/dailyGoalsSummary';

describe('summarizeTodayGoals', () => {
  const today = '2026-07-08';

  const study: Category = {
    id: 's1',
    name: 'Study',
    defaultColor: '#8844cc',
    icon: 'castle',
    type: 'standard',
    sortOrder: 0,
    isHidden: false,
    totalBrickValue: 2,
    currentStageIndex: 0,
    currentStreak: 1,
    longestStreak: 1,
    lastBrickDate: today,
    dailyGoalHours: 1,
    createdAt: today,
  };

  const diet: Category = {
    ...study,
    id: 'd1',
    name: 'Diet',
    type: 'miniature',
    dailyGoalHours: 2,
  };

  it('returns all_met when every tracked category is green', () => {
    expect(
      summarizeTodayGoals([study, diet], { s1: 1, d1: 2 }, today),
    ).toBe('all_met');
  });

  it('returns partial when some progress exists', () => {
    expect(summarizeTodayGoals([study, diet], { s1: 1, d1: 0.5 }, today)).toBe('partial');
  });

  it('returns none when no category has progress', () => {
    expect(summarizeTodayGoals([study, diet], { s1: 0, d1: 0 }, today)).toBe('none');
  });

  it('returns empty for no categories', () => {
    expect(summarizeTodayGoals([], {}, today)).toBe('empty');
  });
});
