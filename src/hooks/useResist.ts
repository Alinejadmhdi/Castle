import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { Brick, BuildingInstance, UnlockEvent } from '@/types';
import { logResistBrickWithRetry } from '@/features/bricks/brickService';
import { useCategoryStore } from '@/store/categoryStore';
import { useMapSceneStore } from '@/store/mapSceneStore';
import { useCelebrationStore } from '@/store/celebrationStore';
import { formatErrorForUser } from '@/utils/formatError';

interface UseResistOptions {
  categoryId: string | undefined;
  categoryType?: string;
  onSceneUpdate?: (categoryId: string, bricks: Brick[], buildings?: BuildingInstance[]) => void;
}

/** One DB write per brick, queued so rapid taps are never dropped. */
export function useResist({ categoryId, categoryType, onSceneUpdate }: UseResistOptions) {
  const syncCategory = useCategoryStore((s) => s.syncCategory);
  const refreshOne = useCategoryStore((s) => s.refreshOne);
  const applyUpdate = useMapSceneStore((s) => s.applyUpdate);
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
      Alert.alert('Could not save brick', message);
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

    try {
      while (queueRef.current > 0) {
        queueRef.current -= 1;
        setPending(queueRef.current);

        try {
          console.log('[Resist] saving brick', categoryId, categoryType);
          const result = await logResistBrickWithRetry(categoryId);
          console.log('[Resist] saved brick ok', result.bricks[0]?.id, 'total', result.category.totalBrickValue);
          syncCategory(result.category);
          setSessionCount((c) => c + 1);

          const brick = result.bricks[0];
          if (brick) {
            const newBuildings = result.unlocks
              .map((u) => u.buildingInstance)
              .filter((b): b is BuildingInstance => b != null);

            if (onSceneUpdateRef.current) {
              onSceneUpdateRef.current(categoryId, [brick], newBuildings);
            } else {
              applyUpdate(categoryId, { brick, buildings: newBuildings });
            }

            if (newBuildings.length > 0) {
              scheduleSyncAfterPlacement(categoryId, newBuildings);
            }
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

      const unlockBatch = pendingUnlocksRef.current;
      pendingUnlocksRef.current = [];
      if (unlockBatch.length > 0) {
        triggerCelebration(unlockBatch);
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
    applyUpdate,
    scheduleSyncAfterPlacement,
    triggerCelebration,
    reportFailure,
  ]);

  const tapResist = useCallback(() => {
    if (!categoryId) {
      reportFailure(new Error('No category selected'), 'tapResist');
      return;
    }
    setError(null);
    queueRef.current += 1;
    setPending(queueRef.current);
    void drainQueue();
  }, [categoryId, drainQueue, reportFailure]);

  return { tapResist, sessionCount, pending, error };
};
