import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Category, DailyBuild } from '@/types';
import { theme } from '@/constants/theme';
import { bricksAddedToday } from '@/features/daily/dailySnapshotService';
import { formatBrickValue } from '@/utils';

interface TodayBricksAccordionProps {
  categories: Category[];
  todayDaily: Record<string, DailyBuild>;
  activeCategoryId: string | null;
}

function brickLine(name: string, added: number): string {
  const label = added === 1 ? 'brick' : 'bricks';
  return `${name}: +${formatBrickValue(added)} ${label} today`;
}

export function TodayBricksAccordion({
  categories,
  todayDaily,
  activeCategoryId,
}: TodayBricksAccordionProps) {
  const [expanded, setExpanded] = useState(false);

  const entries = categories
    .map((category) => ({
      category,
      added: bricksAddedToday(todayDaily[category.id] ?? null, category.totalBrickValue),
    }))
    .filter((entry) => entry.added > 0);

  if (entries.length === 0) return null;

  const activeEntry = activeCategoryId
    ? entries.find((entry) => entry.category.id === activeCategoryId)
    : undefined;

  const ordered = activeEntry
    ? [activeEntry, ...entries.filter((entry) => entry.category.id !== activeCategoryId)]
    : entries;

  const headerEntry = activeEntry ?? ordered[0];
  const showChevron = entries.length > 1 || (entries.length === 1 && !expanded);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setExpanded((open) => !open)}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerText}>
          <Text style={styles.headerLine}>{brickLine(headerEntry.category.name, headerEntry.added)}</Text>
          {!expanded && entries.length > 1 && (
            <Text style={styles.hint}>Tap to see all {entries.length} categories</Text>
          )}
        </View>
        {showChevron && (
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.primary}
          />
        )}
      </Pressable>

      {expanded && entries.length > 1 && (
        <View style={styles.list}>
          {ordered.map((entry) => (
            <Text key={entry.category.id} style={styles.listLine}>
              {brickLine(entry.category.name, entry.added)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.surfaceElevated,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  headerPressed: {
    opacity: 0.85,
  },
  headerText: {
    flex: 1,
  },
  headerLine: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  listLine: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
    paddingTop: theme.spacing.xs,
  },
});
