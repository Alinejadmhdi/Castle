import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getBuildingById } from '@/services/database/buildingRepository';
import { getBrickById } from '@/services/database/brickRepository';
import { getCategoryById } from '@/services/database/repositories';
import type { Brick, BuildingInstance, Category } from '@/types';
import { Card, CardTitle } from '@/components/ui/Card';
import { theme } from '@/constants/theme';
import { formatBrickValue } from '@/utils';

export default function BuildingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [building, setBuilding] = useState<BuildingInstance | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const instance = await getBuildingById(id);
    setBuilding(instance);
    if (!instance) {
      setCategory(null);
      setBricks([]);
      setLoading(false);
      return;
    }
    const cat = await getCategoryById(instance.categoryId);
    setCategory(cat);
    const loaded: Brick[] = [];
    for (const brickId of instance.brickIds) {
      const brick = await getBrickById(brickId);
      if (brick) loaded.push(brick);
    }
    loaded.sort((a, b) => a.completedAt.localeCompare(b.completedAt));
    setBricks(loaded);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const kindLabel = useMemo(() => {
    if (!building) return '';
    switch (building.kind) {
      case 'macro':
        return 'Stage monument';
      case 'miniature':
        return 'Miniature monument';
      case 'sub':
        return 'Sub-building';
      case 'compound':
        return 'Compound';
      case 'daily':
        return 'Daily structure';
      default:
        return building.kind;
    }
  }, [building]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!building) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Building not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{building.name}</Text>
      <Text style={styles.meta}>
        {kindLabel}
        {category ? ` · ${category.name}` : ''}
      </Text>
      <Text style={styles.meta}>
        {formatBrickValue(building.totalBrickValue)} bricks · unlocked{' '}
        {new Date(building.unlockedAt).toLocaleDateString()}
      </Text>

      <Card style={styles.card}>
        <CardTitle>{`Bricks in this structure (${bricks.length})`}</CardTitle>
        {bricks.length === 0 ? (
          <Text style={styles.muted}>No bricks linked yet.</Text>
        ) : (
          bricks.map((brick) => (
            <View key={brick.id} style={styles.brickRow}>
              <View style={[styles.swatch, { backgroundColor: brick.color }]} />
              <View style={styles.brickMeta}>
                <Text style={styles.brickValue}>{formatBrickValue(brick.fractionalValue)} brick</Text>
                <Text style={styles.muted}>
                  {new Date(brick.completedAt).toLocaleString()}
                  {brick.streakRewardLabel ? ` · streak ${brick.streakRewardLabel}` : ''}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: theme.spacing.lg, paddingBottom: 48 },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '700' },
  meta: { color: theme.colors.textMuted, marginTop: 4 },
  card: { marginTop: theme.spacing.lg },
  muted: { color: theme.colors.textMuted, fontSize: 14 },
  brickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  brickMeta: { flex: 1 },
  brickValue: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
});
