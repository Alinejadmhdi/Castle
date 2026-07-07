import {
  getStageForBrickValue,
  getStagesForCategoryType,
} from '@/features/progression/progressionService';
import { reconcileWallBrickAbsorption } from '@/features/bricks/brickService';
import type { Brick, Category } from '@/types';
import { withCategoryLock } from '@/utils/categoryLock';
import {
  deleteBrick,
  deleteSession,
  getBricksBySessionId,
  getSessionById,
  sumBrickValueByCategory,
} from '@/services/database/brickRepository';
import { withDbWrite } from '@/services/database/dbQueue';
import {
  deleteBuildingInstance,
  getBuildingsByCategory,
  getDailyBuildById,
  updateDailyBuild,
} from '@/services/database/buildingRepository';
import { getCategoryById, updateCategory } from '@/services/database/repositories';
import { CENTER_WALL_ABSORBER_KEY } from '@/constants/monumentPersistence';

export async function reconcileBuildingsAfterBrickRemoval(
  category: Category,
  previousTotal: number,
  newTotal: number,
  removedBrickIds: Set<string>,
): Promise<void> {
  const buildings = await getBuildingsByCategory(category.id);
  const stages = getStagesForCategoryType(category.type);
  const prevStage = getStageForBrickValue(previousTotal, category.type);
  const newStage = getStageForBrickValue(newTotal, category.type);
  const stageDropped = newStage.index < prevStage.index;

  for (const building of buildings) {
    if (building.stageKey === CENTER_WALL_ABSORBER_KEY) continue;

    const usesRemovedBrick = building.brickIds.some((id) => removedBrickIds.has(id));
    if (usesRemovedBrick) {
      await deleteBuildingInstance(building.id);
      continue;
    }

    if (building.kind === 'macro' || building.kind === 'miniature') {
      const stage = stages.find((s) => s.key === building.stageKey);
      if (stage && stage.cumulativeBricks > newTotal) {
        await deleteBuildingInstance(building.id);
      }
      continue;
    }

    if (stageDropped && (building.kind === 'compound' || building.kind === 'sub')) {
      await deleteBuildingInstance(building.id);
    }
  }
}

export async function adjustDailyBuildForRemovedBricks(
  bricks: Brick[],
): Promise<void> {
  const byDaily = new Map<string, { removed: number; brickIds: Set<string> }>();
  for (const brick of bricks) {
    if (!brick.dailyBuildId) continue;
    const entry = byDaily.get(brick.dailyBuildId) ?? { removed: 0, brickIds: new Set<string>() };
    entry.removed += brick.fractionalValue;
    entry.brickIds.add(brick.id);
    byDaily.set(brick.dailyBuildId, entry);
  }

  for (const [dailyId, { removed, brickIds }] of byDaily) {
    const daily = await getDailyBuildById(dailyId);
    if (!daily) continue;
    daily.brickValueToday = Math.max(0, daily.brickValueToday - removed);
    daily.brickIds = daily.brickIds.filter((id) => !brickIds.has(id));
    await updateDailyBuild(daily);
  }
}

export async function removeFocusSessionAndBricks(
  sessionId: string,
): Promise<{ categoryId: string; category: Category }> {
  const preview = await getSessionById(sessionId);
  if (!preview) throw new Error('Session not found');

  return withCategoryLock(preview.categoryId, () =>
    withDbWrite(async () => {
      const session = await getSessionById(sessionId);
      if (!session) throw new Error('Session not found');
      if (session.status !== 'completed') {
        throw new Error('Only completed focus sessions can be removed');
      }

      const category = await getCategoryById(session.categoryId);
      if (!category) throw new Error('Category not found');

      const bricks = await getBricksBySessionId(sessionId);
      if (bricks.length === 0) {
        await deleteSession(sessionId);
        return { categoryId: category.id, category };
      }

      const previousTotal = category.totalBrickValue;
      const removedBrickIds = new Set(bricks.map((b) => b.id));

      await adjustDailyBuildForRemovedBricks(bricks);
      for (const brick of bricks) {
        await deleteBrick(brick.id);
      }

      const newTotal = await sumBrickValueByCategory(category.id);
      const newStage = getStageForBrickValue(newTotal, category.type);

      await reconcileBuildingsAfterBrickRemoval(
        category,
        previousTotal,
        newTotal,
        removedBrickIds,
      );

      category.totalBrickValue = newTotal;
      category.currentStageIndex = newStage.index;
      await updateCategory(category);

      await deleteSession(sessionId);
      await reconcileWallBrickAbsorption(category.id);

      const refreshed = await getCategoryById(category.id);
      if (!refreshed) throw new Error('Category not found after update');
      return { categoryId: refreshed.id, category: refreshed };
    }),
  );
}
