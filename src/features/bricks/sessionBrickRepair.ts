import { getStageForBrickValue } from '@/features/progression/progressionService';
import { reconcileWallBrickAbsorption } from '@/features/bricks/brickService';
import type { Brick, Category, FocusSession } from '@/types';
import { msToBrickValue } from '@/utils';
import { sessionElapsedMs } from '@/utils/sessionTiming';
import { withCategoryLock } from '@/utils/categoryLock';
import {
  deleteBrick,
  getBricksBySessionId,
  getSessionsByCategory,
  sumBrickValueByCategory,
  updateBrickFractionalValue,
  updateSession,
} from '@/services/database/brickRepository';
import { withDbWrite } from '@/services/database/dbQueue';
import { getCategoryById, updateCategory } from '@/services/database/repositories';
import {
  adjustDailyBuildForRemovedBricks,
  reconcileBuildingsAfterBrickRemoval,
} from '@/features/bricks/sessionRemovalService';
import { expectedChunksForSession } from '@/features/bricks/sessionBrickRepairLogic';

/**
 * Removes duplicate or over-valued bricks from completed focus sessions.
 * Fixes saves where complete() ran twice and placed extra bricks.
 */
export async function repairFocusSessionBricks(
  categoryId: string,
  fractionalEnabled: boolean,
): Promise<boolean> {
  return withCategoryLock(categoryId, () =>
    withDbWrite(async () => {
      const category = await getCategoryById(categoryId);
      if (!category || category.type !== 'standard') return false;

      const sessions = (await getSessionsByCategory(categoryId)).filter(
        (s) => s.status === 'completed',
      );
      if (sessions.length === 0) return false;

      const removedBricks: Brick[] = [];
      let changed = false;

      for (const session of sessions) {
        const expected = expectedChunksForSession(session, fractionalEnabled);
        const expectedTotal = expected.reduce((sum, v) => sum + v, 0);
        const correctEarned = msToBrickValue(sessionElapsedMs(session), fractionalEnabled);

        if (Math.abs(session.bricksEarned - correctEarned) > 0.001) {
          await updateSession({ ...session, bricksEarned: correctEarned });
          changed = true;
        }

        let actual = await getBricksBySessionId(session.id);
        if (actual.length === 0) continue;

        if (expected.length === 0) {
          for (const brick of actual) {
            await deleteBrick(brick.id);
            removedBricks.push(brick);
            changed = true;
          }
          continue;
        }

        const excessCount = actual.length - expected.length;
        if (excessCount > 0) {
          const sorted = [...actual].sort((a, b) => b.globalIndex - a.globalIndex);
          for (let i = 0; i < excessCount; i++) {
            const brick = sorted[i];
            if (!brick) break;
            await deleteBrick(brick.id);
            removedBricks.push(brick);
            changed = true;
          }
          actual = await getBricksBySessionId(session.id);
        }

        let actualTotal = actual.reduce((sum, b) => sum + b.fractionalValue, 0);
        if (actualTotal > expectedTotal + 0.001) {
          const sorted = [...actual].sort((a, b) => b.globalIndex - a.globalIndex);
          for (const brick of sorted) {
            if (actualTotal <= expectedTotal + 0.001) break;
            await deleteBrick(brick.id);
            removedBricks.push(brick);
            actualTotal -= brick.fractionalValue;
            changed = true;
          }
          actual = await getBricksBySessionId(session.id);
        }

        const aligned = [...actual].sort((a, b) => a.globalIndex - b.globalIndex);
        for (let i = 0; i < expected.length && i < aligned.length; i++) {
          if (Math.abs(aligned[i].fractionalValue - expected[i]) > 0.001) {
            await updateBrickFractionalValue(aligned[i].id, expected[i]);
            changed = true;
          }
        }
      }

      if (!changed) return false;

      const previousTotal = category.totalBrickValue;
      const newTotal = await sumBrickValueByCategory(categoryId);
      const newStage = getStageForBrickValue(newTotal, category.type);
      const removedIds = new Set(removedBricks.map((b) => b.id));

      if (removedBricks.length > 0) {
        await adjustDailyBuildForRemovedBricks(removedBricks);
        await reconcileBuildingsAfterBrickRemoval(
          category,
          previousTotal,
          newTotal,
          removedIds,
        );
      }

      const updated: Category = {
        ...category,
        totalBrickValue: newTotal,
        currentStageIndex: newStage.index,
      };
      await updateCategory(updated);
      await reconcileWallBrickAbsorption(categoryId);
      return true;
    }),
  );
}
