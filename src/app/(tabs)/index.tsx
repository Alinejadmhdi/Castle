import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useCategoryStore } from '@/store/categoryStore';
import { useTimerStore } from '@/store/timerStore';
import { useMapSceneStore } from '@/store/mapSceneStore';
import { SettlementPlot } from '@/components/map/SettlementPlot';
import { MapPlotPlaceholder } from '@/components/map/MapPlotPlaceholder';
import { MapActionPanel, type MapPanelMode, type SceneBrickUpdate } from '@/components/map/MapActionPanel';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { ConfettiOverlay } from '@/components/celebration/ConfettiOverlay';
import { UnlockCelebration } from '@/components/celebration/UnlockCelebration';
import { useCelebrationStore } from '@/store/celebrationStore';
import { MINIATURE_SCALE } from '@/constants/miniatureBuildings';

export default function LifeMapScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { categories, loading, load } = useCategoryStore();
  const { session, lastResult } = useTimerStore();
  const scenes = useMapSceneStore((s) => s.scenes);
  const loadAll = useMapSceneStore((s) => s.loadAll);
  const applyUpdate = useMapSceneStore((s) => s.applyUpdate);
  const refreshCategory = useMapSceneStore((s) => s.refreshCategory);
  const { active, unlocks, dismiss } = useCelebrationStore();
  const [panel, setPanel] = useState<{ categoryId: string; mode: MapPanelMode } | null>(null);

  const categoryIds = useMemo(() => categories.map((c) => c.id), [categories]);

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

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (categoryIds.length === 0) return;
      void (async () => {
        await loadAll(categoryIds);
        for (const cat of categories) {
          await refreshCategory(cat.id);
        }
      })();
    }, [categories, categoryIds, loadAll, refreshCategory]),
  );

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

  const panelMode: MapPanelMode =
    panel?.mode ?? (panelCategory?.type === 'miniature' ? 'resist' : 'focus-setup');

  const activePlotCategoryId = session?.categoryId ?? null;

  function openFocus(categoryId: string) {
    if (session && session.categoryId !== categoryId) return;
    setPanel({ categoryId, mode: 'focus-setup' });
  }

  function openResist(categoryId: string) {
    setPanel({ categoryId, mode: 'resist' });
  }

  function closePanel() {
    if (session) return;
    setPanel(null);
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
            const showPlot =
              isFocused && (activePlotCategoryId == null || activePlotCategoryId === cat.id);
            return (
              <View key={cat.id} style={styles.plotCard}>
                <View style={styles.plotHeader}>
                  <Text style={styles.plotName}>{cat.name}</Text>
                  <Text style={styles.plotMeta}>
                    {cat.totalBrickValue.toFixed(1)} bricks · streak {cat.currentStreak}
                  </Text>
                </View>
                {showPlot ? (
                  <SettlementPlot
                    bricks={scene?.bricks ?? []}
                    buildings={scene?.buildings ?? []}
                    scale={cat.type === 'miniature' ? MINIATURE_SCALE : 1}
                    totalBrickValue={cat.totalBrickValue}
                    categoryType={cat.type}
                    wallColor={cat.defaultColor}
                  />
                ) : (
                  <MapPlotPlaceholder square />
                )}
                <View style={styles.plotActions}>
                  <Button
                    title="View Settlement"
                    onPress={() => router.push(`/category/${cat.id}`)}
                    variant="secondary"
                  />
                  {cat.type === 'standard' ? (
                    <Button
                      title={session?.categoryId === cat.id ? 'Focusing…' : 'Focus'}
                      onPress={() => openFocus(cat.id)}
                      style={styles.focusBtn}
                      disabled={!!session && session.categoryId !== cat.id}
                    />
                  ) : (
                    <Button
                      title="Log Resist"
                      onPress={() => openResist(cat.id)}
                      style={styles.focusBtn}
                    />
                  )}
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
          onSceneRefresh={refreshCategoryScene}
          isTabFocused={isFocused}
        />
      )}

      <ConfettiOverlay visible={active} />
      <UnlockCelebration visible={active} unlocks={unlocks} onDismiss={dismiss} />
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
  plotHeader: { marginBottom: theme.spacing.sm },
  plotName: { color: theme.colors.text, fontSize: 18, fontWeight: '600' },
  plotMeta: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2 },
  plotActions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  focusBtn: { flex: 1 },
  addBtn: { marginTop: theme.spacing.sm },
});
