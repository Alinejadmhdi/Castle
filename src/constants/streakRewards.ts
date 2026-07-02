import type { StreakMilestone } from '@/types';

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, label: '3', badgeColor: '#CD7F32' },
  { days: 7, label: '7', badgeColor: '#C0C0C0' },
  { days: 14, label: '14', badgeColor: '#FFD700' },
  { days: 30, label: '30', badgeColor: '#E5E4E2' },
  { days: 60, label: '60', badgeColor: '#E0115F' },
  { days: 100, label: '100', badgeColor: '#B9F2FF' },
  { days: 365, label: '365', badgeColor: '#9B59B6' },
];

export function getStreakRewardLabel(streakDay: number): number | null {
  let reward: number | null = null;
  for (const milestone of STREAK_MILESTONES) {
    if (streakDay >= milestone.days) {
      reward = milestone.days;
    }
  }
  return reward;
}

export function getStreakMilestone(days: number): StreakMilestone | undefined {
  return STREAK_MILESTONES.find((m) => m.days === days);
}
