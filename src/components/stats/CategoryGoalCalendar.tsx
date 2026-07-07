import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import type { Category } from '@/types';
import { theme } from '@/constants/theme';
import {
  daysInMonth,
  firstWeekdayMondayIndex,
  monthLabel,
  toDateKey,
} from '@/utils/calendarDates';
import { todayLocalDate } from '@/utils';
import { classifyDayGoalStatus, type DayGoalStatus } from '@/features/stats/dayGoalStatus';
import {
  getCategoryBrickHoursForMonth,
  getCategoryBrickHoursForYear,
} from '@/features/stats/categoryCalendarData';
import { updateCategoryDailyGoal } from '@/services/database/repositories';
import { useCategoryStore } from '@/store/categoryStore';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type CalendarMode = 'month' | 'year';

function statusColor(status: DayGoalStatus | 'neutral'): string {
  switch (status) {
    case 'red':
      return '#c94c4c';
    case 'yellow':
      return '#c9a227';
    case 'green':
      return '#4a9e5c';
    case 'today':
      return theme.colors.surfaceElevated;
    default:
      return theme.colors.background;
  }
}

function statusTextColor(status: DayGoalStatus | 'neutral'): string {
  if (status === 'today' || status === 'future') return theme.colors.textMuted;
  return '#fff';
}

interface CategoryGoalCalendarProps {
  category: Category;
}

export function CategoryGoalCalendar({ category }: CategoryGoalCalendarProps) {
  const today = todayLocalDate();
  const todayParts = useMemo(() => {
    const [y, m] = today.split('-').map(Number);
    return { year: y, month: m };
  }, [today]);

  const [mode, setMode] = useState<CalendarMode>('month');
  const [year, setYear] = useState(todayParts.year);
  const [month, setMonth] = useState(todayParts.month);
  const [goalInput, setGoalInput] = useState(String(category.dailyGoalHours));
  const [hoursByDay, setHoursByDay] = useState<Record<string, number>>({});
  const [yearHours, setYearHours] = useState<Record<string, number>>({});
  const syncCategory = useCategoryStore((s) => s.syncCategory);
  const refreshOne = useCategoryStore((s) => s.refreshOne);

  useEffect(() => {
    setGoalInput(String(category.dailyGoalHours));
  }, [category.dailyGoalHours]);

  useEffect(() => {
    if (mode === 'month') {
      void getCategoryBrickHoursForMonth(category.id, year, month, category.type).then(
        setHoursByDay,
      );
    } else {
      void getCategoryBrickHoursForYear(category.id, year, category.type).then(setYearHours);
    }
  }, [category.id, category.type, year, month, mode]);

  async function saveGoal() {
    const parsed = parseFloat(goalInput.replace(',', '.'));
    const goal = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    await updateCategoryDailyGoal(category.id, goal);
    await refreshOne(category.id);
    const updated = useCategoryStore.getState().categories.find((c) => c.id === category.id);
    if (updated) syncCategory(updated);
    setGoalInput(String(goal));
  }

  function goPrev() {
    if (mode === 'year') {
      setYear((y) => y - 1);
      return;
    }
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goNext() {
    if (mode === 'year') {
      setYear((y) => y + 1);
      return;
    }
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const goalHours = category.dailyGoalHours;

  const monthCells = useMemo(() => {
    const totalDays = daysInMonth(year, month);
    const leading = firstWeekdayMondayIndex(year, month);
    const cells: Array<{ day: number | null; key: string | null }> = [];
    for (let i = 0; i < leading; i++) cells.push({ day: null, key: null });
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ day: d, key: toDateKey(year, month, d) });
    }
    return cells;
  }, [year, month]);

  return (
    <View style={styles.wrap}>
      <View style={styles.goalRow}>
        <Text style={styles.goalLabel}>Daily goal (hours)</Text>
        <TextInput
          style={styles.goalInput}
          keyboardType="decimal-pad"
          value={goalInput}
          onChangeText={setGoalInput}
          onBlur={() => void saveGoal()}
          onSubmitEditing={() => void saveGoal()}
        />
      </View>

      <View style={styles.modeRow}>
        <Pressable
          style={[styles.modeChip, mode === 'month' && styles.modeChipOn]}
          onPress={() => setMode('month')}
        >
          <Text style={styles.modeText}>Month</Text>
        </Pressable>
        <Pressable
          style={[styles.modeChip, mode === 'year' && styles.modeChipOn]}
          onPress={() => setMode('year')}
        >
          <Text style={styles.modeText}>Year</Text>
        </Pressable>
      </View>

      <View style={styles.navRow}>
        <Pressable onPress={goPrev} hitSlop={8}>
          <Text style={styles.navBtn}>‹</Text>
        </Pressable>
        <Text style={styles.periodLabel}>
          {mode === 'month' ? monthLabel(year, month) : String(year)}
        </Text>
        <Pressable onPress={goNext} hitSlop={8}>
          <Text style={styles.navBtn}>›</Text>
        </Pressable>
      </View>

      {mode === 'month' ? (
        <>
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={`${w}-${i}`} style={styles.weekday}>
                {w}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {monthCells.map((cell, idx) => {
              if (!cell.day || !cell.key) {
                return <View key={`e-${idx}`} style={styles.dayCell} />;
              }
              const brickHours = hoursByDay[cell.key] ?? 0;
              const status = classifyDayGoalStatus(cell.key, brickHours, goalHours, today);
              return (
                <View
                  key={cell.key}
                  style={[styles.dayCell, { backgroundColor: statusColor(status) }]}
                >
                  <Text style={[styles.dayNum, { color: statusTextColor(status) }]}>
                    {cell.day}
                  </Text>
                  {brickHours > 0 && status !== 'future' && (
                    <Text style={[styles.dayHours, { color: statusTextColor(status) }]}>
                      {brickHours >= 1 && brickHours === Math.floor(brickHours)
                        ? String(brickHours)
                        : brickHours.toFixed(1)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </>
      ) : (
        <View style={styles.yearHeatmap}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const totalDays = daysInMonth(year, m);
            const monthShort = new Date(year, m - 1, 1).toLocaleDateString(undefined, {
              month: 'short',
            });
            return (
              <View key={m} style={styles.yearMonthRow}>
                <Text style={styles.yearMonthName}>{monthShort}</Text>
                <View style={styles.yearDayStrip}>
                  {Array.from({ length: totalDays }, (_, d) => d + 1).map((day) => {
                    const key = toDateKey(year, m, day);
                    const brickHours = yearHours[key] ?? 0;
                    const status = classifyDayGoalStatus(key, brickHours, goalHours, today);
                    return (
                      <Pressable
                        key={key}
                        style={[styles.yearDayDot, { backgroundColor: statusColor(status) }]}
                        accessibilityLabel={`${key}, ${brickHours} hours`}
                        onPress={() => {
                          setMonth(m);
                          setMode('month');
                        }}
                      />
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.legend}>
        <LegendDot color={statusColor('red')} label="Missed" />
        <LegendDot color={statusColor('yellow')} label="Partial" />
        <LegendDot color={statusColor('green')} label="Goal met" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: theme.spacing.sm },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  goalLabel: { color: theme.colors.textMuted, fontSize: 14 },
  goalInput: {
    minWidth: 56,
    textAlign: 'center',
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceElevated,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
    fontSize: 16,
  },
  modeRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  modeChip: {
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceElevated,
  },
  modeChipOn: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceElevated },
  modeText: { color: theme.colors.text, fontSize: 13 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  navBtn: { color: theme.colors.primary, fontSize: 28, paddingHorizontal: theme.spacing.sm },
  periodLabel: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surface,
    padding: 2,
  },
  dayNum: { fontSize: 13, fontWeight: '600' },
  dayHours: { fontSize: 9, marginTop: 1 },
  yearHeatmap: { gap: 6 },
  yearMonthRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  yearMonthName: {
    width: 32,
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  yearDayStrip: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  yearDayDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 12, height: 12, borderRadius: 3 },
  legendText: { color: theme.colors.textMuted, fontSize: 12 },
});
