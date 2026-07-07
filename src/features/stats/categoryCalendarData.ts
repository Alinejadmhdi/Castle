import type { CategoryType } from '@/types';
import { getBricksByCategory } from '@/services/database/brickRepository';
import { getDailyBuildsForCategoryBetween } from '@/services/database/buildingRepository';
import { toDateKey } from '@/utils/calendarDates';

function localDateKeyFromIso(iso: string): string {
  const d = new Date(iso);
  return toDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** Brick-hours placed per calendar day for a category (focus daily builds + resist bricks). */
export async function getCategoryBrickHoursByDay(
  categoryId: string,
  startDate: string,
  endDate: string,
  categoryType: CategoryType,
): Promise<Record<string, number>> {
  const hours: Record<string, number> = {};

  if (categoryType === 'standard') {
    const dailies = await getDailyBuildsForCategoryBetween(categoryId, startDate, endDate);
    for (const daily of dailies) {
      if (daily.brickValueToday > 0) {
        hours[daily.date] = daily.brickValueToday;
      }
    }
    return hours;
  }

  const bricks = await getBricksByCategory(categoryId);
  for (const brick of bricks) {
    const key = localDateKeyFromIso(brick.completedAt);
    if (key < startDate || key > endDate) continue;
    hours[key] = (hours[key] ?? 0) + brick.fractionalValue;
  }
  return hours;
}

export async function getCategoryBrickHoursForMonth(
  categoryId: string,
  year: number,
  month: number,
  categoryType: CategoryType,
): Promise<Record<string, number>> {
  const start = toDateKey(year, month, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const end = toDateKey(year, month, lastDay);
  return getCategoryBrickHoursByDay(categoryId, start, end, categoryType);
}

export async function getCategoryBrickHoursForYear(
  categoryId: string,
  year: number,
  categoryType: CategoryType,
): Promise<Record<string, number>> {
  const start = toDateKey(year, 1, 1);
  const end = toDateKey(year, 12, 31);
  return getCategoryBrickHoursByDay(categoryId, start, end, categoryType);
}

/** Dominant day status for a month (for year view cell coloring). */
export function summarizeMonthStatus(
  hoursByDay: Record<string, number>,
  goalHours: number,
  year: number,
  month: number,
  todayKey: string,
): 'red' | 'yellow' | 'green' | 'neutral' {
  const lastDay = new Date(year, month, 0).getDate();
  let red = 0;
  let yellow = 0;
  let green = 0;

  for (let day = 1; day <= lastDay; day++) {
    const key = toDateKey(year, month, day);
    if (key > todayKey) continue;
    const h = hoursByDay[key] ?? 0;
    const goal = Math.max(0, goalHours);
    if (key === todayKey) {
      if (h >= goal && goal > 0) green++;
      else if (h > 0) yellow++;
      continue;
    }
    if (h <= 0) red++;
    else if (goal > 0 && h >= goal) green++;
    else yellow++;
  }

  if (green >= yellow && green >= red && green > 0) return 'green';
  if (yellow >= red && yellow > 0) return 'yellow';
  if (red > 0) return 'red';
  return 'neutral';
}
