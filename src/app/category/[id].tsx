import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCategoryById } from '@/services/database/repositories';
import { getBricksByCategory } from '@/services/database/brickRepository';
import { getBuildingsByCategory } from '@/services/database/buildingRepository';
import { getDailyBuild } from '@/services/database/buildingRepository';
import { MACRO_BUILDING_STAGES } from '@/constants/buildings';
import { MINIATURE_BUILDING_STAGES, MINIATURE_SCALE } from '@/constants/miniatureBuildings';
import type { Brick, BuildingInstance, Category, DailyBuild } from '@/types';
import { SettlementPlot } from '@/components/map/SettlementPlot';
import { BrickPopover } from '@/components/brick/BrickPopover';
import { Card, CardTitle } from '@/components/ui/Card';
import { theme } from '@/constants/theme';
import { todayLocalDate } from '@/utils';

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [buildings, setBuildings] = useState<BuildingInstance[]>([]);
  const [daily, setDaily] = useState<DailyBuild | null>(null);
  const [selectedBrick, setSelectedBrick] = useState<Brick | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const cat = await getCategoryById(id);
    setCategory(cat);
    setBricks(await getBricksByCategory(id));
    setBuildings(await getBuildingsByCategory(id));
    setDaily(await getDailyBuild(id, todayLocalDate()));
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!category) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const stages = category.type === 'miniature' ? MINIATURE_BUILDING_STAGES : MACRO_BUILDING_STAGES;
  const stage = stages[category.currentStageIndex];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{category.name}</Text>
      <Text style={styles.meta}>
        Stage: {stage?.name ?? 'Starting'} · {category.totalBrickValue.toFixed(2)} brick-hours
      </Text>

      <SettlementPlot
        bricks={bricks}
        buildings={buildings}
        scale={category.type === 'miniature' ? MINIATURE_SCALE : 1}
        totalBrickValue={category.totalBrickValue}
        categoryType={category.type}
        wallColor={category.defaultColor}
        highlightBrickId={selectedBrick?.id}
        onBrickPress={setSelectedBrick}
      />

      {daily && !daily.sealed && category.type === 'standard' && (
        <Card style={styles.card}>
          <CardTitle>Today&apos;s build</CardTitle>
          <Text style={styles.cardText}>{daily.brickValueToday.toFixed(2)} hrs logged today</Text>
        </Card>
      )}

      {buildings.length > 0 && (
        <Card style={styles.card}>
          <CardTitle>{`Completed structures (${buildings.length})`}</CardTitle>
          {buildings.map((b) => (
            <Pressable key={b.id} onPress={() => router.push(`/building/${b.id}`)}>
              <Text style={styles.buildingRow}>
                {b.name} · {b.brickIds.length} bricks · {b.kind}
              </Text>
            </Pressable>
          ))}
        </Card>
      )}

      <BrickPopover
        brick={selectedBrick}
        visible={!!selectedBrick}
        onClose={() => setSelectedBrick(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: theme.spacing.lg, paddingBottom: 48 },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '700' },
  meta: { color: theme.colors.textMuted, marginBottom: theme.spacing.lg },
  card: { marginTop: theme.spacing.lg },
  cardText: { color: theme.colors.textMuted },
  buildingRow: { color: theme.colors.text, marginTop: 4, fontSize: 14 },
});
