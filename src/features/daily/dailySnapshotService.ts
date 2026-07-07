import type { DailyBuild } from '@/types';
import { getOrCreateDailyBuild } from '@/services/database/buildingRepository';
import { getCategoryById } from '@/services/database/repositories';
import { todayLocalDate } from '@/utils';

export function bricksAddedToday(daily: DailyBuild | null, totalBrickValue: number): number {
  if (!daily) return 0;
  const added = totalBrickValue - daily.startingBrickValue;
  return Math.max(0, Math.round(added * 1000) / 1000);
}

/** Records today's starting brick total so we can show bricks added since midnight. */
export async function ensureTodayDailySnapshot(categoryId: string): Promise<DailyBuild> {
  const cat = await getCategoryById(categoryId);
  if (!cat) throw new Error('Category not found');
  return getOrCreateDailyBuild(categoryId, todayLocalDate(), cat.totalBrickValue);
}

export async function ensureAllTodayDailySnapshots(categoryIds: string[]): Promise<void> {
  await Promise.all(categoryIds.map((id) => ensureTodayDailySnapshot(id)));
}
