import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useCategoryStore } from '@/store/categoryStore';
import { getAllSessions } from '@/services/database/brickRepository';
import type { FocusSession } from '@/types';
import { theme } from '@/constants/theme';
import { Card, CardTitle } from '@/components/ui/Card';
import { CategoryGoalCalendar } from '@/components/stats/CategoryGoalCalendar';
import { brickValueToHours } from '@/utils';

export default function StatsScreen() {
  const { categories, load } = useCategoryStore();
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  useEffect(() => {
    void load();
    void getAllSessions().then(setSessions);
  }, [load]);

  const completed = sessions.filter((s) => s.status === 'completed');
  const totalHours = completed.reduce((sum, s) => sum + s.bricksEarned, 0);
  const totalBricks = categories.reduce((sum, c) => sum + c.totalBrickValue, 0);

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.title}>Stats</Text>

        <Card style={styles.card}>
          <CardTitle>Overview</CardTitle>
          <Text style={styles.stat}>Total focus hours: {brickValueToHours(totalHours)}</Text>
          <Text style={styles.stat}>Total bricks: {totalBricks.toFixed(2)}</Text>
          <Text style={styles.stat}>Sessions completed: {completed.length}</Text>
          <Text style={styles.stat}>Categories: {categories.length}</Text>
        </Card>

        {categories.map((cat) => (
          <Card key={cat.id} style={styles.card}>
            <CardTitle>{cat.name}</CardTitle>
            <Text style={styles.stat}>Bricks: {cat.totalBrickValue.toFixed(2)}</Text>
            <Text style={styles.stat}>Current streak: {cat.currentStreak} days</Text>
            <Text style={styles.stat}>Longest streak: {cat.longestStreak} days</Text>
            <CategoryGoalCalendar category={cat} />
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg, paddingBottom: 48 },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '700', marginBottom: theme.spacing.lg },
  card: { marginBottom: theme.spacing.md },
  stat: { color: theme.colors.textMuted, marginTop: 4 },
});
