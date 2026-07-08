import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Category } from '@/types';
import { theme } from '@/constants/theme';
import { todayLocalDate } from '@/utils';
import { getDailyFulfillmentQuote } from '@/constants/dailyFulfillmentQuotes';
import {
  DAILY_BAR_COLORS,
  categoryGoalStatusForToday,
  summarizeTodayGoals,
  type DailyAggregateStatus,
} from '@/features/stats/dailyGoalsSummary';
import { useBrickConfettiStore } from '@/store/brickConfettiStore';

interface DailyProgressBarProps {
  categories: Category[];
  hoursByCategoryId: Record<string, number>;
}

function statusLabel(status: DailyAggregateStatus): string {
  switch (status) {
    case 'all_met':
      return 'All goals met today';
    case 'partial':
      return 'Building today — keep going';
    case 'none':
      return 'No goals met yet today';
    default:
      return 'Set daily goals per category below';
  }
}

function statusSubtext(status: DailyAggregateStatus, met: number, total: number): string {
  if (status === 'empty') return 'Add categories and daily hour goals to track your day.';
  if (status === 'all_met') return `Every category fulfilled (${met}/${total}).`;
  if (status === 'partial') return `${met} of ${total} categories at goal so far.`;
  return `${total} categor${total === 1 ? 'y' : 'ies'} waiting on today's bricks.`;
}

export function DailyProgressBar({ categories, hoursByCategoryId }: DailyProgressBarProps) {
  const today = todayLocalDate();
  const status = summarizeTodayGoals(categories, hoursByCategoryId, today);
  const tracked = categories.filter((c) => c.dailyGoalHours > 0);
  const pool = tracked.length > 0 ? tracked : categories;
  const metCount = pool.filter(
    (c) => categoryGoalStatusForToday(c, hoursByCategoryId[c.id] ?? 0, today) === 'green',
  ).length;
  const quote = getDailyFulfillmentQuote(today);
  const celebratedRef = useRef<string | null>(null);
  const triggerConfetti = useBrickConfettiStore((s) => s.triggerBrickConfetti);

  useEffect(() => {
    if (status !== 'all_met') return;
    if (celebratedRef.current === today) return;
    celebratedRef.current = today;
    triggerConfetti('celebration');
  }, [status, today, triggerConfetti]);

  const barColor = DAILY_BAR_COLORS[status === 'empty' ? 'empty' : status];

  return (
    <View style={styles.wrap}>
      <View style={[styles.bar, { backgroundColor: barColor }]}>
        <Text style={styles.barTitle}>{statusLabel(status)}</Text>
        <Text style={styles.barMeta}>{statusSubtext(status, metCount, pool.length)}</Text>
      </View>

      {status === 'all_met' && (
        <View style={styles.celebration}>
          <Text style={styles.congrats}>Congratulations — you fulfilled today.</Text>
          <Text style={styles.quote}>"{quote.text}"</Text>
          <Text style={styles.author}>— {quote.author}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: theme.spacing.lg,
  },
  bar: {
    width: '100%',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  barTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  barMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 4,
  },
  celebration: {
    marginTop: 0,
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: DAILY_BAR_COLORS.all_met,
  },
  congrats: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  quote: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  author: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: theme.spacing.sm,
    textAlign: 'right',
  },
});
