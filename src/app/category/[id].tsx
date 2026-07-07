import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCategoryById } from '@/services/database/repositories';
import { getBricksByCategory, getSessionsByCategory } from '@/services/database/brickRepository';
import { removeFocusSessionAndBricks, removeBrickAndRollback } from '@/features/bricks/sessionRemovalService';
import { repairFocusSessionBricks } from '@/features/bricks/sessionBrickRepair';
import { useCategoryStore } from '@/store/categoryStore';
import { useMapSceneStore } from '@/store/mapSceneStore';
import { useSettingsStore } from '@/store/settingsStore';
import { confirmAction } from '@/utils/confirm';
import { formatSessionSummary, countSessionBricks } from '@/utils/formatSession';
import { formatResistBrickSummary } from '@/utils/formatResistBrick';
import { getBuildingsByCategory } from '@/services/database/buildingRepository';
import { getDailyBuild } from '@/services/database/buildingRepository';
import { MACRO_BUILDING_STAGES } from '@/constants/buildings';
import type { Brick, BuildingInstance, Category, DailyBuild, FocusSession } from '@/types';
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
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [selectedBrick, setSelectedBrick] = useState<Brick | null>(null);
  const [removingSessionId, setRemovingSessionId] = useState<string | null>(null);
  const [removingBrickId, setRemovingBrickId] = useState<string | null>(null);
  const refreshOne = useCategoryStore((s) => s.refreshOne);
  const refreshCategory = useMapSceneStore((s) => s.refreshCategory);

  const load = useCallback(async () => {
    if (!id) return;
    const fractionalEnabled = useSettingsStore.getState().settings.fractionalBricksEnabled;
    const repaired = await repairFocusSessionBricks(id, fractionalEnabled);
    if (repaired) {
      await refreshOne(id);
      await refreshCategory(id);
    }
    const cat = await getCategoryById(id);
    setCategory(cat);
    setBricks(await getBricksByCategory(id));
    setBuildings(await getBuildingsByCategory(id));
    setSessions(
      (await getSessionsByCategory(id)).filter((s) => s.status === 'completed'),
    );
    setDaily(await getDailyBuild(id, todayLocalDate()));
  }, [id, refreshOne, refreshCategory]);

  const handleRemoveSession = useCallback(
    (session: FocusSession) => {
      const placed = countSessionBricks(bricks, session.id);
      confirmAction(
        'Remove focus session?',
        `This removes ${placed.count} brick${placed.count === 1 ? '' : 's'} and may undo building progress.`,
        'Remove',
        async () => {
          setRemovingSessionId(session.id);
          try {
            const { categoryId, category: updated } = await removeFocusSessionAndBricks(session.id);
            useCategoryStore.getState().syncCategory(updated);
            await refreshCategory(categoryId);
            await load();
            await refreshOne(categoryId);
          } catch (error) {
            console.error('removeFocusSessionAndBricks failed:', error);
          } finally {
            setRemovingSessionId(null);
          }
        },
        true,
      );
    },
    [bricks, load, refreshCategory, refreshOne],
  );

  const handleRemoveBrick = useCallback(
    (brick: Brick) => {
      confirmAction(
        'Remove resist brick?',
        'This removes 1 brick and may undo building progress.',
        'Remove',
        async () => {
          setRemovingBrickId(brick.id);
          try {
            const { categoryId, category: updated } = await removeBrickAndRollback(brick.id);
            useCategoryStore.getState().syncCategory(updated);
            if (selectedBrick?.id === brick.id) setSelectedBrick(null);
            await refreshCategory(categoryId);
            await load();
            await refreshOne(categoryId);
          } catch (error) {
            console.error('removeBrickAndRollback failed:', error);
          } finally {
            setRemovingBrickId(null);
          }
        },
        true,
      );
    },
    [load, refreshCategory, refreshOne, selectedBrick?.id],
  );

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

  const stages = MACRO_BUILDING_STAGES;
  const stage = stages[category.currentStageIndex];
  const focusBricks = bricks.filter((b) => b.sessionId);
  const orphanBricks = bricks.filter((b) => !b.sessionId);
  const resistBricks = [...orphanBricks].sort((a, b) => b.globalIndex - a.globalIndex);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{category.name}</Text>
      <Text style={styles.meta}>
        Stage: {stage?.name ?? 'Starting'} · {category.totalBrickValue.toFixed(2)} brick-hours
      </Text>

      <SettlementPlot
        bricks={bricks}
        buildings={buildings}
        scale={1}
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

      {category.type === 'standard' && sessions.length > 0 && (
        <Card style={styles.card}>
          <CardTitle>Focus sessions</CardTitle>
          <Text style={styles.sessionMeta}>
            {sessions.length} session{sessions.length === 1 ? '' : 's'} · {focusBricks.length}{' '}
            brick{focusBricks.length === 1 ? '' : 's'} on wall
            {orphanBricks.length > 0
              ? ` · ${orphanBricks.length} other brick${orphanBricks.length === 1 ? '' : 's'}`
              : ''}
          </Text>
          {sessions.map((session) => {
            const placed = countSessionBricks(bricks, session.id);
            return (
            <View key={session.id} style={styles.sessionRow}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionText}>
                  {formatSessionSummary(session, placed)}
                </Text>
              </View>
              <Pressable
                onPress={() => handleRemoveSession(session)}
                disabled={removingSessionId === session.id}
                style={styles.removeBtn}
              >
                <Text style={styles.removeBtnText}>
                  {removingSessionId === session.id ? '…' : 'Remove'}
                </Text>
              </Pressable>
            </View>
            );
          })}
        </Card>
      )}

      {category.type === 'miniature' && resistBricks.length > 0 && (
        <Card style={styles.card}>
          <CardTitle>Resist log</CardTitle>
          <Text style={styles.sessionMeta}>
            {resistBricks.length} brick{resistBricks.length === 1 ? '' : 's'} on wall
          </Text>
          {resistBricks.map((brick) => (
            <View key={brick.id} style={styles.sessionRow}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionText}>{formatResistBrickSummary(brick)}</Text>
              </View>
              <Pressable
                onPress={() => handleRemoveBrick(brick)}
                disabled={removingBrickId === brick.id}
                style={styles.removeBtn}
              >
                <Text style={styles.removeBtnText}>
                  {removingBrickId === brick.id ? '…' : 'Remove'}
                </Text>
              </Pressable>
            </View>
          ))}
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
        onRemove={
          category.type === 'miniature' && selectedBrick
            ? () => handleRemoveBrick(selectedBrick)
            : undefined
        }
        removing={!!selectedBrick && removingBrickId === selectedBrick.id}
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
  sessionMeta: { color: theme.colors.textMuted, fontSize: 13, marginBottom: theme.spacing.sm },
  buildingRow: { color: theme.colors.text, marginTop: 4, fontSize: 14 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  sessionInfo: { flex: 1 },
  sessionText: { color: theme.colors.text, fontSize: 14 },
  removeBtn: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.danger + '22',
  },
  removeBtnText: { color: theme.colors.danger, fontSize: 13, fontWeight: '600' },
});
