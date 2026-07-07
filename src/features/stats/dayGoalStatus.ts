export type DayGoalStatus = 'future' | 'today' | 'red' | 'yellow' | 'green';

export function classifyDayGoalStatus(
  dateKey: string,
  brickHours: number,
  goalHours: number,
  todayKey: string,
): DayGoalStatus {
  if (compareDateKeys(dateKey, todayKey) > 0) return 'future';

  const goal = Math.max(0, goalHours);
  const hours = Math.max(0, brickHours);

  if (dateKey === todayKey) {
    if (goal <= 0) return hours > 0 ? 'green' : 'today';
    if (hours >= goal) return 'green';
    if (hours > 0) return 'yellow';
    return 'today';
  }

  if (hours <= 0) return 'red';
  if (goal <= 0) return 'green';
  if (hours >= goal) return 'green';
  return 'yellow';
}

function compareDateKeys(a: string, b: string): number {
  return a.localeCompare(b);
}
