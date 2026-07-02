import type { DailyBuildingTier } from '@/types';

export const DAILY_BUILDING_TIERS: DailyBuildingTier[] = [
  { key: 'day_paver', name: 'Day Paver', minHours: 2, maxHours: 3.99, brickValue: 2 },
  { key: 'day_post', name: 'Day Post', minHours: 4, maxHours: 5.99, brickValue: 4 },
  { key: 'day_shed', name: 'Day Shed', minHours: 6, maxHours: 7.99, brickValue: 6 },
  { key: 'day_workshop', name: 'Day Workshop', minHours: 8, maxHours: 9.99, brickValue: 8 },
  { key: 'day_pavilion', name: 'Day Pavilion', minHours: 10, maxHours: Infinity, brickValue: 10 },
];

export function getDailyStructureForHours(hours: number): DailyBuildingTier | null {
  if (hours < 2) return null;
  return (
    DAILY_BUILDING_TIERS.find((t) => hours >= t.minHours && hours <= t.maxHours) ?? null
  );
}

export function getDailyStructureForBrickValue(brickValue: number): DailyBuildingTier | null {
  return getDailyStructureForHours(brickValue);
}
