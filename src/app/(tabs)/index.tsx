import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useCategoryStore } from '@/store/categoryStore';
import { useTimerStore } from '@/store/timerStore';
import { useMapSceneStore } from '@/store/mapSceneStore';
import { SettlementPlot } from '@/components/map/SettlementPlot';
import { SettlementPlotPreview } from '@/components/map/SettlementPlotPreview';
import { MapPlotPlaceholder } from '@/components/map/MapPlotPlaceholder';
import { MapActionPanel, type MapPanelMode, type SceneBrickUpdate } from '@/components/map/MapActionPanel';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { getCheckpointProgress } from '@/features/progression/checkpointProgress';
import { confirmAction } from '@/utils/confirm';
import {
  bricksAddedToday,
  ensureAllTodayDailySnapshots,
} from '@/features/daily/dailySnapshotService';
import { getDailyBuildsForDate } from '@/services/database/buildingRepository';
import { formatBrickValue, todayLocalDate } from '@/utils';
import type { DailyBuild } from '@/types';

export default function LifeMapScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { categories, loading, remove } = useCategoryStore();
  const { session, lastResult } = useTimerStore();
  const scenes = useMapSceneStore((s) => s.scenes);
  const loadAll = useMapSceneStore((s) => s.loadAll);
  const loadCategory = useMapSceneStore((s) => s.loadCategory);
  const loadingIds = useMapSceneStore((s) => s.loadingIds);
  const applyUpdate = useMapSceneStore((s) => s.applyUpdate);
  const refreshCategory = useMapSceneStore((s) => s.refreshCategory);
  const [panel, setPanel] = useState<{ categoryId: string; mode: MapPanelMode } | null>(null);
  const [todayDaily, setTodayDaily] = useState<Record<string, DailyBuild>>({});

  const categoryIdsKey = useMemo(
    () => categories.map((c) => c.id).join(','),
    [categories],
  );

  const refreshCategoryScene = useCallback(
    async (categoryId: string, update?: SceneBrickUpdate) => {
      if (update) {
        applyUpdate(categoryId, update);
        return;
      }
      await refreshCategory(categoryId);
    },
    [applyUpdate, refreshCategory],
  );

  const refreshTodayCounts = useCallback(async (categoryIds: string[]) => {
    if (categoryIds.length === 0) {
      setTodayDaily({});
      return;
    }
    await ensureAllTodayDailySnapshots(categoryIds);
    const dailies = await getDailyBuildsForDate(todayLocalDate());
    const map: Record<string, DailyBuild> = {};
    for (const d of dailies) {
      map[d.categoryId] = d;
    }
    setTodayDaily(map);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const ids = categoryIdsKey ? categoryIdsKey.split(',') : [];
      if (ids.length === 0) return;
      void loadAll(ids);
      void refreshTodayCounts(ids);
      const timer = useTimerStore.getState();
      timer.ensureTicking();
      void timer.syncFromClock();
    }, [categoryIdsKey, loadAll, refreshTodayCounts]),
  );

  useEffect(() => {
    if (!isFocused) return;
    const ids = categories.map((c) => c.id);
    if (ids.length > 0) {
      void refreshTodayCounts(ids);
    }
  }, [isFocused, categories, lastResult, refreshTodayCounts]);

  useEffect(() => {
    if (!isFocused) return;
    const timer = useTimerStore.getState();
    if (timer.session?.status === 'active') {
      timer.ensureTicking();
      void timer.syncFromClock();
    }
  }, [isFocused, session?.status]);

  useEffect(() => {
    if (!isFocused || panel) return;
    for (const cat of categories) {
      const expected = Math.floor(cat.totalBrickValue);
      const loaded = scenes[cat.id]?.bricks?.length ?? 0;
      if (expected > 0 && loaded < expected) {
        void refreshCategory(cat.id);
        break;
      }
    }
  }, [isFocused, panel, categories, scenes, refreshCategory]);

  const panelCategory = useMemo(() => {
    if (session) {
      return categories.find((c) => c.id === session.categoryId) ?? null;
    }
    if (lastResult?.bricks[0]?.categoryId) {
      return categories.find((c) => c.id === lastResult.bricks[0].categoryId) ?? null;
    }
    if (panel) {
      return categories.find((c) => c.id === panel.categoryId) ?? null;
    }
    return null;
  }, [categories, session, lastResult, panel]);

  const showPanel = panelCategory != null && (panel != null || session != null || lastResult != null);

  const panelMode =
    panel?.mode ?? (panelCategory?.type === 'miniature' ? 'resist' : 'focus-setup');

  function openFocus(categoryId: string) {
    const timer = useTimerStore.getState();
    const { session: activeSession } = timer;
    if (activeSession?.status === 'active' && activeSession.categoryId !== categoryId) return;
    if (activeSession?.status === 'paused' && activeSession.categoryId !== categoryId) {
      void timer.abandon();
    }
    timer.clearResult();
    setPanel({ categoryId, mode: 'focus-setup' });
  }

  function openResist(categoryId: string) {
    useMapSceneStore.getState().seedEmptyScene(categoryId);
    setPanel({ categoryId, mode: 'resist' });
    void loadCategory(categoryId);
  }

  function confirmDeleteCategory(id: string, name: string) {
    confirmAction(
      'Delete category',
      `Remove "${name}" and all its bricks?`,
      'Delete',
      async () => {
        if (panel?.categoryId === id) dismissPanel();
        await remove(id);
      },
      true,
    );
  }

  function dismissPanel() {
    useTimerStore.getState().clearResult();
    setPanel(null);
  }

  function closePanel() {
    if (useTimerStore.getState().session) return;
    dismissPanel();
  }

  if (loading && categories.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Life Map</Text>
        <Text style={styles.subtitle}>Bird&apos;s-eye view of your settlements</Text>

        {categories.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No categories yet. Create one to start building.</Text>
            <Button title="Create Category" onPress={() => router.push('/category/new')} />
          </View>
        ) : (
          categories.map((cat) => {
            const scene = scenes[cat.id];
            const sceneLoading = loadingIds[cat.id] === true;
            const checkpoint = getCheckpointProgress(cat.totalBrickValue, cat.type);
            const addedToday = bricksAddedToday(todayDaily[cat.id] ?? null, cat.totalBrickValue);
            const glCategoryId = session?.categoryId ?? panel?.categoryId ?? null;
            const showFullPlot = isFocused && glCategoryId === cat.id;
            const showLitePlot = isFocused && !showFullPlot;
            return (
              <View key={cat.id} style={styles.plotCard}>
                <View style={styles.plotHeader}>
                  <View style={styles.plotHeaderText}>
                    <Text style={styles.plotName}>{cat.name}</Text>
                    <Text style={styles.plotToday}>
                      +{formatBrickValue(addedToday)} brick{addedToday === 1 ? '' : 's'} today
                    </Text>
                    <Text style={styles.plotMeta}>
                      {checkpoint.label} toward {checkpoint.nextStageName}
                      {' · '}streak {cat.currentStreak}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => confirmDeleteCategory(cat.id, cat.name)}
                    hitSlop={8}
                  >
                    <Text style={styles.delete}>Delete</Text>
                  </Pressable>
                </View>
                {showFullPlot ? (
                  sceneLoading && !scene ? (
                    <View style={styles.plotLoading}>
                      <ActivityIndicator color={theme.colors.primary} />
                    </View>
                  ) : (
                    <SettlementPlot
                      bricks={scene?.bricks ?? []}
                      buildings={scene?.buildings ?? []}
                      scale={1}
                      totalBrickValue={cat.totalBrickValue}
                      categoryType={cat.type}
                      wallColor={cat.defaultColor}
                    />
                  )
                ) : showLitePlot ? (
                  sceneLoading && !scene ? (
                    <View style={styles.plotLoading}>
                      <ActivityIndicator color={theme.colors.primary} />
                    </View>
                  ) : (
                    <SettlementPlotPreview
                      bricks={scene?.bricks ?? []}
                      buildings={scene?.buildings ?? []}
                      totalBrickValue={cat.totalBrickValue}
                      categoryType={cat.type}
                    />
                  )
                ) : (
                  <MapPlotPlaceholder square />
                )}
                <View style={styles.plotActions}>
                  <Button
                    title="View Settlement"
                    onPress={() => router.push(`/category/${cat.id}`)}
                    variant="secondary"
                  />
                  <Button
                    title={
                      session?.categoryId === cat.id
                        ? 'Focusing…'
                        : cat.type === 'miniature'
                          ? 'Log Resist'
                          : 'Focus'
                    }
                    onPress={() =>
                      cat.type === 'miniature' ? openResist(cat.id) : openFocus(cat.id)
                    }
                    style={styles.focusBtn}
                    disabled={!!session && session.categoryId !== cat.id}
                  />
                </View>
              </View>
            );
          })
        )}

        <Button
          title="+ Add Category"
          onPress={() => router.push('/category/new')}
          variant="secondary"
          style={styles.addBtn}
        />
      </ScrollView>

      {showPanel && panelCategory && (
        <MapActionPanel
          category={panelCategory}
          mode={panelMode}
          onClose={closePanel}
          onEndSession={dismissPanel}
          onSceneRefresh={refreshCategoryScene}
          isTabFocused={isFocused}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: theme.spacing.lg, paddingBottom: 48 },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: '700' },
  subtitle: { color: theme.colors.textMuted, marginBottom: theme.spacing.lg },
  empty: { gap: theme.spacing.md, marginTop: theme.spacing.xl },
  emptyText: { color: theme.colors.textMuted, fontSize: 16 },
  plotCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  plotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  plotHeaderText: { flex: 1, marginRight: theme.spacing.sm },
  plotLoading: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4a9238',
  },
  plotName: { color: theme.colors.text, fontSize: 18, fontWeight: '600' },
  plotToday: { color: theme.colors.primary, fontSize: 14, fontWeight: '600', marginTop: 2 },
  plotMeta: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2 },
  delete: { color: theme.colors.danger, fontSize: 14, fontWeight: '600' },
  plotActions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  focusBtn: { flex: 1 },
  addBtn: { marginTop: theme.spacing.sm },
});
