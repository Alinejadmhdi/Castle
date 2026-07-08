import type { Category } from '@/types';
import { classifyDayGoalStatus, type DayGoalStatus } from '@/features/stats/dayGoalStatus';

export type DailyAggregateStatus = 'all_met' | 'partial' | 'none' | 'empty';

export function categoryGoalStatusForToday(
  category: Category,
  brickHours: number,
  todayKey: string,
): DayGoalStatus {
  if (category.dailyGoalHours <= 0) {
    return brickHours > 0 ? 'green' : 'today';
  }
  return classifyDayGoalStatus(todayKey, brickHours, category.dailyGoalHours, todayKey);
}

export function summarizeTodayGoals(
  categories: Category[],
  hoursByCategoryId: Record<string, number>,
  todayKey: string,
): DailyAggregateStatus {
  if (categories.length === 0) return 'empty';

  const tracked = categories.filter((c) => c.dailyGoalHours > 0);
  const pool = tracked.length > 0 ? tracked : categories;

  const statuses = pool.map((cat) =>
    categoryGoalStatusForToday(cat, hoursByCategoryId[cat.id] ?? 0, todayKey),
  );

  if (statuses.every((s) => s === 'green')) return 'all_met';

  const anyProgress = statuses.some((s) => s === 'green' || s === 'yellow');
  if (!anyProgress) return 'none';

  return 'partial';
}

export const DAILY_BAR_COLORS = {
  all_met: '#4a9e5c',
  partial: '#3d5a78',
  none: '#a84848',
  empty: '#3d3228',
} as const;
