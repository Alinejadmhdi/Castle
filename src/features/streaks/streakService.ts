import { getStreakRewardLabel } from '@/constants/streakRewards';
import { isConsecutiveDay, isSameDay, todayLocalDate } from '@/utils';

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  lastBrickDate: string;
  rewardLabel: number | null;
  isNewMilestone: boolean;
}

export function updateStreak(
  lastBrickDate: string | null,
  currentStreak: number,
  longestStreak: number,
  brickDate: string = todayLocalDate(),
): StreakUpdateResult {
  if (lastBrickDate && isSameDay(lastBrickDate, brickDate)) {
    return {
      currentStreak,
      longestStreak,
      lastBrickDate: brickDate,
      rewardLabel: getStreakRewardLabel(currentStreak),
      isNewMilestone: false,
    };
  }

  let newStreak: number;
  if (lastBrickDate && isConsecutiveDay(lastBrickDate, brickDate)) {
    newStreak = currentStreak + 1;
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(longestStreak, newStreak);
  const rewardLabel = getStreakRewardLabel(newStreak);
  const previousReward = getStreakRewardLabel(currentStreak);
  const isNewMilestone = rewardLabel !== null && rewardLabel !== previousReward;

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastBrickDate: brickDate,
    rewardLabel,
    isNewMilestone,
  };
}
