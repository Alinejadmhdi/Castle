import { useCallback, useRef, useState } from 'react';
import { Alert, InteractionManager, Platform } from 'react-native';
import type { Brick, BuildingInstance, Category, UnlockEvent } from '@/types';
import { logResistBrickWithRetry } from '@/features/bricks/brickService';
import { useCategoryStore } from '@/store/categoryStore';
import { usePlotRenderStore } from '@/store/plotRenderStore';
import { useMapSceneStore } from '@/store/mapSceneStore';
import { useCelebrationStore } from '@/store/celebrationStore';
import { formatErrorForUser } from '@/utils/formatError';

interface UseResistOptions {
  categoryId: string | undefined;
  categoryType?: string;
  onSceneUpdate?: (categoryId: string, bricks: Brick[], buildings?: BuildingInstance[]) => void;
}

function dedupeBuildings(buildings: BuildingInstance[]): BuildingInstance[] {
  const seen = new Set<string>();
  return buildings.filter((b) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });
}

/** One DB write per brick, queued so rapid taps are never dropped. */
export function useResist({ categoryId, categoryType, onSceneUpdate }: UseResistOptions) {
  const syncCategory = useCategoryStore((s) => s.syncCategory);
  const refreshOne = useCategoryStore((s) => s.refreshOne);
  const applyBatchUpdate = useMapSceneStore((s) => s.applyBatchUpdate);
  const scheduleSyncAfterPlacement = useMapSceneStore((s) => s.scheduleSyncAfterPlacement);
  const triggerCelebration = useCelebrationStore((s) => s.trigger);

  const onSceneUpdateRef = useRef(onSceneUpdate);
  onSceneUpdateRef.current = onSceneUpdate;

  const queueRef = useRef(0);
  const processingRef = useRef(false);
  const pendingUnlocksRef = useRef<UnlockEvent[]>([]);

  const [sessionCount, setSessionCount] = useState(0);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reportFailure = useCallback(
    (err: unknown, phase: string) => {
      const detail = formatErrorForUser(err);
      const context = categoryId
        ? `categoryId=${categoryId}${categoryType ? ` type=${categoryType}` : ''}`
        : 'no categoryId';
      const message = `[${phase}] ${context}\n\n${detail}`;
      console.error('[Resist]', message, err);
      setError(message);
      if (Platform.OS !== 'android') {
        Alert.alert('Could not save brick', message);
      }
    },
    [categoryId, categoryType],
  );

  const drainQueue = useCallback(async () => {
    if (processingRef.current || !categoryId) {
      if (!categoryId) {
        reportFailure(new Error('No category selected'), 'tapResist');
      }
      return;
    }
    processingRef.current = true;

    const placedBricks: Brick[] = [];
    const placedBuildings: BuildingInstance[] = [];
    let latestCategory: Category | null = null;

    try {
      while (queueRef.current > 0) {
        queueRef.current -= 1;
        setPending(queueRef.current);

        try {
          console.log('[Resist] saving brick', categoryId, categoryType);
          const result = await logResistBrickWithRetry(categoryId);
          console.log('[Resist] saved brick ok', result.bricks[0]?.id, 'total', result.category.totalBrickValue);
          latestCategory = result.category;
          setSessionCount((c) => c + 1);

          const brick = result.bricks[0];
          if (brick) {
            placedBricks.push(brick);
            const newBuildings = result.unlocks
              .map((u) => u.buildingInstance)
              .filter((b): b is BuildingInstance => b != null);
            placedBuildings.push(...newBuildings);
          }

          if (result.unlocks.length > 0) {
            pendingUnlocksRef.current.push(...result.unlocks);
          }
          setError(null);
        } catch (err) {
          queueRef.current = 0;
          setPending(0);
          pendingUnlocksRef.current = [];
          reportFailure(err, 'logResistBrick');
          void refreshOne(categoryId);
          break;
        }
      }

      if (placedBricks.length > 0) {
        const buildings = dedupeBuildings(placedBuildings);
        if (onSceneUpdateRef.current) {
          onSceneUpdateRef.current(categoryId, placedBricks, buildings);
        } else {
          applyBatchUpdate(categoryId, placedBricks, buildings);
        }
        if (buildings.length > 0) {
          scheduleSyncAfterPlacement(categoryId, buildings);
        }
      }

      if (latestCategory) {
        syncCategory(latestCategory);
      }

      const unlockBatch = pendingUnlocksRef.current;
      pendingUnlocksRef.current = [];
      if (unlockBatch.length > 0) {
        InteractionManager.runAfterInteractions(() => {
          triggerCelebration(unlockBatch);
        });
      }
    } finally {
      processingRef.current = false;
      setPending(queueRef.current);
    }
  }, [
    categoryId,
    categoryType,
    syncCategory,
    refreshOne,
    applyBatchUpdate,
    scheduleSyncAfterPlacement,
    triggerCelebration,
    reportFailure,
  ]);

  const tapResist = useCallback(() => {
    if (!categoryId) {
      reportFailure(new Error('No category selected'), 'tapResist');
      return;
    }
    usePlotRenderStore.getState().activate3d(categoryId);
    setError(null);
    queueRef.current += 1;
    setPending(queueRef.current);
    void drainQueue();
  }, [categoryId, drainQueue, reportFailure]);

  return { tapResist, sessionCount, pending, error };
};
