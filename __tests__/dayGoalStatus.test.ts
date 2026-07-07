import { classifyDayGoalStatus } from '@/features/stats/dayGoalStatus';

describe('classifyDayGoalStatus', () => {
  const today = '2026-07-07';
  const goal = 2;

  it('marks past empty days red', () => {
    expect(classifyDayGoalStatus('2026-07-06', 0, goal, today)).toBe('red');
  });

  it('marks past partial days yellow', () => {
    expect(classifyDayGoalStatus('2026-07-06', 1, goal, today)).toBe('yellow');
  });

  it('marks past goal days green', () => {
    expect(classifyDayGoalStatus('2026-07-06', 2, goal, today)).toBe('green');
  });

  it('does not mark today red before bricks', () => {
    expect(classifyDayGoalStatus(today, 0, goal, today)).toBe('today');
  });

  it('marks today yellow when partial', () => {
    expect(classifyDayGoalStatus(today, 1, goal, today)).toBe('yellow');
  });

  it('marks future days as future', () => {
    expect(classifyDayGoalStatus('2026-07-08', 0, goal, today)).toBe('future');
  });
});
