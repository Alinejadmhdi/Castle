import { sealDailyBuild } from '@/features/bricks/brickService';
import { getAllCategories } from '@/services/database/repositories';
import { getUnsealedDailyBuildsBefore } from '@/services/database/buildingRepository';
import type { UnlockEvent } from '@/types';
import { todayLocalDate } from '@/utils';

/** Seal any prior days that were left open (midnight rollover). */
export async function sealStaleDailyBuilds(): Promise<UnlockEvent[]> {
  const today = todayLocalDate();
  const stale = await getUnsealedDailyBuildsBefore(today);
  const unlocks: UnlockEvent[] = [];

  for (const daily of stale) {
    const event = await sealDailyBuild(daily.categoryId, daily.date);
    if (event) unlocks.push(event);
  }

  return unlocks;
}

/** User taps "Finish day" — seal today's daily structures for all standard categories. */
export async function finishTodayForAllCategories(): Promise<UnlockEvent[]> {
  const today = todayLocalDate();
  const categories = await getAllCategories();
  const unlocks: UnlockEvent[] = [];

  for (const cat of categories) {
    if (cat.type !== 'standard') continue;
    const event = await sealDailyBuild(cat.id, today);
    if (event) unlocks.push(event);
  }

  return unlocks;
}
