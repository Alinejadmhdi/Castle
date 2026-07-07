import { MACRO_BUILDING_STAGES } from '@/constants/buildings';
import { getCompoundRuleForStageGap } from '@/constants/compoundBuildings';
import { getDailyStructureForBrickValue } from '@/constants/dailyBuildings';
import { MINIATURE_BUILDING_STAGES, MINIATURE_SCALE } from '@/constants/miniatureBuildings';
import {
  allocateBrickToStage,
  checkMacroStageUnlock,
  computeGridPosition,
  getStageForBrickValue,
  getStagesForCategoryType,
} from '@/features/progression/progressionService';
import { updateStreak } from '@/features/streaks/streakService';
import type { Brick, BuildingInstance, Category, FocusSession, UnlockEvent } from '@/types';
import { generateId, msToBrickValue, splitBrickValue, todayLocalDate } from '@/utils';
import { withCategoryLock } from '@/utils/categoryLock';
import { getAllCategories } from '@/services/database/repositories';
import {
  insertBrick,
  getBrickCount,
  getBrickCountForStage,
  getBricksByCategory,
  assignBricksToBuilding,
} from '@/services/database/brickRepository';
import { withDbWrite } from '@/services/database/dbQueue';
import {
  deleteBuildingInstance,
  getOrCreateDailyBuild,
  insertBuildingInstance,
  getBuildingsByCategory,
  getSubBuildingsByKey,
  updateDailyBuild,
} from '@/services/database/buildingRepository';
import { getMonumentPlotSlot, getEarlyRingSlot } from '@/rendering/three/settlementLayout';
import {
  CENTER_WALL_ABSORBER_KEY,
  EARLY_REPLACE_MAX_STAGE_INDEX,
  isEarlyReplaceMonumentStage,
  MONUMENT_PERSIST_FROM_STAGE_INDEX,
  shouldPersistStageMonument,
} from '@/constants/monumentPersistence';
import { getCategoryById, incrementCategoryAfterBrick } from '@/services/database/repositories';
import { waitForCategory, withDbRetry } from '@/services/database/categoryReadiness';

export interface BrickCreationResult {
  bricks: Brick[];
  unlocks: UnlockEvent[];
  category: Category;
}

async function createMacroBuildingInstance(
  category: Category,
  stageKey: string,
  name: string,
  kind: BuildingInstance['kind'],
  brickIds: string[],
  totalValue: number,
  plotOffset: number,
  scale = 1,
  sourceIds: string[] = [],
  fixedSlot?: { plotX: number; plotY: number },
): Promise<BuildingInstance> {
  const existing = await getBuildingsByCategory(category.id);
  const plotMonuments = existing.filter(
    (b) =>
      (b.kind === 'macro' || b.kind === 'miniature') &&
      b.stageKey !== CENTER_WALL_ABSORBER_KEY,
  );
  const isMiniature = category.type === 'miniature';
  const stages = isMiniature ? MINIATURE_BUILDING_STAGES : MACRO_BUILDING_STAGES;
  const stageIndex = stages.find((s) => s.key === stageKey)?.index ?? 0;
  const slot =
    fixedSlot ??
    getMonumentPlotSlot(
      plotMonuments.length,
      category.id,
      plotMonuments,
      scale,
      isMiniature,
      stageIndex,
      1,
      category.currentStageIndex,
    );
  const building: BuildingInstance = {
    id: generateId(),
    categoryId: category.id,
    kind,
    stageKey,
    name,
    brickIds,
    totalBrickValue: totalValue,
    plotX: slot.plotX,
    plotY: slot.plotY + plotOffset,
    scale,
    unlockedAt: new Date().toISOString(),
    parentCompoundId: null,
    sourceInstanceIds: sourceIds,
  };
  await insertBuildingInstance(building);
  return building;
}

function getStageIndexForKey(
  stageKey: string,
  isMiniature: boolean,
): number {
  const stages = isMiniature ? MINIATURE_BUILDING_STAGES : MACRO_BUILDING_STAGES;
  return stages.find((s) => s.key === stageKey)?.index ?? -1;
}

async function removeEarlyMonuments(
  categoryId: string,
  monumentKind: BuildingInstance['kind'],
  isMiniature: boolean,
): Promise<void> {
  const existing = await getBuildingsByCategory(categoryId);
  const toRemove = existing.filter(
    (b) =>
      b.kind === monumentKind &&
      isEarlyReplaceMonumentStage(getStageIndexForKey(b.stageKey, isMiniature)),
  );
  await Promise.all(toRemove.map((b) => deleteBuildingInstance(b.id)));
}

async function upsertEarlyMonument(
  category: Category,
  completedStageIndex: number,
  monumentKind: BuildingInstance['kind'],
  absorbedIds: string[],
  brickId: string,
): Promise<BuildingInstance | null> {
  const isMiniature = category.type === 'miniature';
  const stages = isMiniature ? MINIATURE_BUILDING_STAGES : MACRO_BUILDING_STAGES;
  const completedStage = stages[completedStageIndex];
  if (!completedStage) return null;

  await removeEarlyMonuments(category.id, monumentKind, isMiniature);

  const categoryBricks = await getBricksByCategory(category.id);
  const stageBricks =
    absorbedIds.length > 0
      ? absorbedIds
      : categoryBricks
          .filter(
            (b) =>
              b.id !== brickId &&
              b.stageIndex === completedStageIndex &&
              b.buildingInstanceId == null,
          )
          .map((b) => b.id);

  const instance = await createMacroBuildingInstance(
    category,
    completedStage.key,
    completedStage.name,
    monumentKind,
    stageBricks,
    completedStage.cumulativeBricks,
    0,
    isMiniature ? MINIATURE_SCALE : 1,
    [],
    getEarlyRingSlot(1, category.currentStageIndex),
  );

  if (stageBricks.length > 0) {
    await assignBricksToBuilding(stageBricks, instance.id);
  }
  return instance;
}

async function getOrCreateCenterAbsorber(category: Category): Promise<BuildingInstance> {
  const existing = await getBuildingsByCategory(category.id);
  const found = existing.find((b) => b.stageKey === CENTER_WALL_ABSORBER_KEY);
  if (found) return found;

  const building: BuildingInstance = {
    id: generateId(),
    categoryId: category.id,
    kind: 'sub',
    stageKey: CENTER_WALL_ABSORBER_KEY,
    name: 'Settlement Core',
    brickIds: [],
    totalBrickValue: 0,
    plotX: 0,
    plotY: 0,
    scale: 0,
    unlockedAt: new Date().toISOString(),
    parentCompoundId: null,
    sourceInstanceIds: [],
  };
  await insertBuildingInstance(building);
  return building;
}

async function absorbCompletedStageWallBricks(
  categoryId: string,
  category: Category,
  completedStageIndex: number,
): Promise<void> {
  const categoryBricks = await getBricksByCategory(categoryId);
  const toAbsorb = categoryBricks.filter(
    (b) => b.stageIndex === completedStageIndex && b.buildingInstanceId == null,
  );
  if (toAbsorb.length === 0) return;
  const center = await getOrCreateCenterAbsorber(category);
  await assignBricksToBuilding(
    toAbsorb.map((b) => b.id),
    center.id,
  );
}

/** Repairs saves where old wall bricks were never absorbed after a stage upgrade. */
export async function reconcileWallBrickAbsorption(categoryId: string): Promise<void> {
  const category = await getCategoryById(categoryId);
  if (!category) return;
  const bricks = await getBricksByCategory(categoryId);
  const currentStage = getStageForBrickValue(category.totalBrickValue, category.type);
  const stale = bricks.filter(
    (b) => b.buildingInstanceId == null && b.stageIndex < currentStage.index,
  );
  if (stale.length === 0) return;
  const center = await getOrCreateCenterAbsorber(category);
  await assignBricksToBuilding(
    stale.map((b) => b.id),
    center.id,
  );
}

async function checkCompoundUnlock(
  category: Category,
  stageBrickCount: number,
  categoryBrickTotal: number,
): Promise<UnlockEvent | null> {
  const rule = getCompoundRuleForStageGap(stageBrickCount);
  const subs = await getSubBuildingsByKey(category.id, rule.subKey);
  const uncombined = subs.filter((s) => !s.parentCompoundId);

  if (uncombined.length < rule.combineCount) return null;

  const toCombine = uncombined.slice(0, rule.combineCount);
  const compound = await createMacroBuildingInstance(
    category,
    rule.compoundKey,
    rule.compoundName,
    'compound',
    toCombine.flatMap((s) => s.brickIds),
    rule.subBrickCount * rule.combineCount,
    0,
    1,
    toCombine.map((s) => s.id),
  );

  return {
    type: 'compound',
    buildingInstance: compound,
    stageKey: rule.compoundKey,
    stageName: rule.compoundName,
    cumulativeBricks: categoryBrickTotal,
    categoryBrickTotal,
  };
}

async function maybeCreateSubBuilding(
  category: Category,
  stageIndex: number,
  brickIds: string[],
  brickValue: number,
  categoryBrickTotal: number,
): Promise<UnlockEvent | null> {
  const stage = MACRO_BUILDING_STAGES[stageIndex];
  if (!stage?.usesCompoundFill) return null;

  const rule = getCompoundRuleForStageGap(stage.stageBrickCount);
  const subs = await getSubBuildingsByKey(category.id, rule.subKey);
  const subIndex = subs.length + 1;

  const sub = await createMacroBuildingInstance(
    category,
    rule.subKey,
    `${rule.subName} ${subIndex}`,
    'sub',
    brickIds,
    brickValue,
    1,
  );

  return {
    type: 'compound',
    buildingInstance: sub,
    stageKey: rule.subKey,
    stageName: sub.name,
    cumulativeBricks: categoryBrickTotal,
    categoryBrickTotal,
  };
}

export async function addBrickToCategory(
  categoryId: string,
  color: string,
  brickValue: number,
  sessionId: string | null,
  isMiniature: boolean,
): Promise<BrickCreationResult> {
  return withCategoryLock(categoryId, () =>
    withDbWrite(async () => {
      const result = await addBrickToCategoryLocked(
        categoryId,
        color,
        brickValue,
        sessionId,
        isMiniature,
      );
      await reconcileWallBrickAbsorption(categoryId);
      const refreshed = await getCategoryById(categoryId);
      return { ...result, category: refreshed ?? result.category };
    }),
  );
}

async function addBrickToCategoryLocked(
  categoryId: string,
  color: string,
  brickValue: number,
  sessionId: string | null,
  isMiniature: boolean,
): Promise<BrickCreationResult> {
  const category = await getCategoryById(categoryId);
  if (!category) throw new Error('Category not found');

  const unlocks: UnlockEvent[] = [];
  const previousValue = category.totalBrickValue;
  const newValue = previousValue + brickValue;
  const today = todayLocalDate();

  const streakResult = updateStreak(
    category.lastBrickDate,
    category.currentStreak,
    category.longestStreak,
    today,
  );

  const unlockedStage = checkMacroStageUnlock(previousValue, newValue, category.type);
  const stageInfo = allocateBrickToStage(newValue, category.type);
  const stageForBrick = unlockedStage ?? stageInfo.stage;
  const stages = getStagesForCategoryType(category.type);
  const prevStageForBrick = stages[stageForBrick.index - 1];
  const positionInStage = newValue - (prevStageForBrick?.cumulativeBricks ?? 0);
  const stageStackIndex = await getBrickCountForStage(categoryId, stageForBrick.index);
  const grid = computeGridPosition(stageStackIndex);
  const count = await getBrickCount(categoryId);

  let dailyBuildId: string | null = null;
  const daily = await getOrCreateDailyBuild(categoryId, today, previousValue);
  if (!isMiniature && category.type === 'standard') {
    daily.brickValueToday += brickValue;
    dailyBuildId = daily.id;
    await updateDailyBuild(daily);
  }

  const brick: Brick = {
    id: generateId(),
    categoryId,
    color,
    sessionId,
    fractionalValue: brickValue,
    globalIndex: count + 1,
    stageIndex: stageForBrick.index,
    positionInStage,
    dailyBuildId,
    buildingInstanceId: null,
    gridX: grid.gridX,
    gridY: grid.gridY,
    streakRewardLabel: streakResult.rewardLabel,
    completedAt: new Date().toISOString(),
    isMiniature,
  };

  await insertBrick(brick);

  category.totalBrickValue = await incrementCategoryAfterBrick(categoryId, brickValue, {
    currentStageIndex: stageForBrick.index,
    currentStreak: streakResult.currentStreak,
    longestStreak: streakResult.longestStreak,
    lastBrickDate: streakResult.lastBrickDate,
  });
  category.currentStageIndex = stageForBrick.index;
  category.currentStreak = streakResult.currentStreak;
  category.longestStreak = streakResult.longestStreak;
  category.lastBrickDate = streakResult.lastBrickDate;

  if (unlockedStage) {
    const stage = unlockedStage;
    const completedStageIndex = unlockedStage.index - 1;
    const monumentKind = category.type === 'miniature' ? 'miniature' : 'macro';
    const isMiniature = category.type === 'miniature';

    if (unlockedStage.index === MONUMENT_PERSIST_FROM_STAGE_INDEX) {
      await removeEarlyMonuments(category.id, monumentKind, isMiniature);
    }

    const shouldReplaceEarly =
      completedStageIndex >= 0 &&
      completedStageIndex <= EARLY_REPLACE_MAX_STAGE_INDEX &&
      unlockedStage.index < MONUMENT_PERSIST_FROM_STAGE_INDEX;

    if (shouldReplaceEarly) {
      const categoryBricks = await getBricksByCategory(categoryId);
      const absorbedBricks = categoryBricks.filter(
        (b) =>
          b.id !== brick.id &&
          b.stageIndex === completedStageIndex &&
          b.buildingInstanceId == null,
      );
      const absorbedIds = absorbedBricks.map((b) => b.id);

      const instance = await upsertEarlyMonument(
        category,
        completedStageIndex,
        monumentKind,
        absorbedIds,
        brick.id,
      );

      if (completedStageIndex >= 0) {
        await absorbCompletedStageWallBricks(categoryId, category, completedStageIndex);
      }

      unlocks.push({
        type: isMiniature ? 'miniature' : 'macro',
        buildingInstance: instance ?? undefined,
        stageKey: stage.key,
        stageName: stage.name,
        cumulativeBricks: stage.cumulativeBricks,
        categoryBrickTotal: newValue,
      });
    } else if (shouldPersistStageMonument(category.type, unlockedStage.index)) {
      const categoryBricks = await getBricksByCategory(categoryId);
      const existingMonuments = (await getBuildingsByCategory(categoryId)).filter(
        (b) => b.kind === monumentKind,
      );

      const completedStage =
        completedStageIndex >= 0 ? stages[completedStageIndex] : null;

      if (
        completedStage &&
        !existingMonuments.some((b) => b.stageKey === completedStage.key)
      ) {
        const absorbedBricks = categoryBricks.filter(
          (b) =>
            b.id !== brick.id &&
            b.stageIndex === completedStageIndex &&
            b.buildingInstanceId == null,
        );
        const absorbedIds = absorbedBricks.map((b) => b.id);

        const instance = await createMacroBuildingInstance(
          category,
          completedStage.key,
          completedStage.name,
          monumentKind,
          absorbedIds,
          completedStage.cumulativeBricks,
          0,
          category.type === 'miniature' ? MINIATURE_SCALE : 1,
        );

        if (absorbedIds.length > 0) {
          await assignBricksToBuilding(absorbedIds, instance.id);
        }
        unlocks.push({
          type: category.type === 'miniature' ? 'miniature' : 'macro',
          buildingInstance: instance,
          stageKey: completedStage.key,
          stageName: completedStage.name,
          cumulativeBricks: completedStage.cumulativeBricks,
          categoryBrickTotal: newValue,
        });
      } else {
        if (completedStageIndex >= 0) {
          await absorbCompletedStageWallBricks(categoryId, category, completedStageIndex);
        }
        unlocks.push({
          type: category.type === 'miniature' ? 'miniature' : 'macro',
          stageKey: stage.key,
          stageName: stage.name,
          cumulativeBricks: stage.cumulativeBricks,
          categoryBrickTotal: newValue,
        });
      }
    } else {
      if (completedStageIndex >= 0) {
        await absorbCompletedStageWallBricks(categoryId, category, completedStageIndex);
      }
      unlocks.push({
        type: category.type === 'miniature' ? 'miniature' : 'macro',
        stageKey: stage.key,
        stageName: stage.name,
        cumulativeBricks: stage.cumulativeBricks,
        categoryBrickTotal: newValue,
      });
    }
  } else if (category.type === 'standard' && stageInfo.stage.usesCompoundFill) {
    const subUnlock = await maybeCreateSubBuilding(
      category,
      stageInfo.stage.index,
      [brick.id],
      brickValue,
      newValue,
    );
    if (subUnlock) {
      unlocks.push(subUnlock);
      const compound = await checkCompoundUnlock(
        category,
        stageInfo.stage.stageBrickCount,
        newValue,
      );
      if (compound) unlocks.push(compound);
    }
  }

  const refreshed = await getCategoryById(categoryId);
  return { bricks: [brick], unlocks, category: refreshed ?? category };
}

async function addMiniatureResistBatchLocked(
  categoryId: string,
  count: number,
): Promise<BrickCreationResult> {
  const category = await getCategoryById(categoryId);
  if (!category || category.type !== 'miniature') {
    throw new Error('Not a miniature category');
  }

  const allBricks: Brick[] = [];
  const allUnlocks: UnlockEvent[] = [];
  let latest = category;

  for (let i = 0; i < count; i++) {
    const result = await addBrickToCategoryLocked(
      categoryId,
      category.defaultColor,
      1,
      null,
      true,
    );
    allBricks.push(...result.bricks);
    allUnlocks.push(...result.unlocks);
    latest = result.category;
  }

  await reconcileWallBrickAbsorption(categoryId);
  const refreshed = await getCategoryById(categoryId);
  return { bricks: allBricks, unlocks: allUnlocks, category: refreshed ?? latest };
}

export async function flushMiniatureResistBatch(
  categoryId: string,
  count: number,
): Promise<BrickCreationResult> {
  if (count <= 0) throw new Error('Invalid batch size');
  return withCategoryLock(categoryId, () =>
    withDbWrite(() => addMiniatureResistBatchLocked(categoryId, count)),
  );
}

export async function completeSessionBricks(
  session: FocusSession,
  elapsedMs: number,
  fractionalEnabled: boolean,
): Promise<BrickCreationResult | null> {
  const totalBrickValue = msToBrickValue(elapsedMs, fractionalEnabled);
  if (totalBrickValue <= 0) return null;

  const chunks = splitBrickValue(totalBrickValue, fractionalEnabled);
  if (chunks.length === 0) return null;

  let latest: BrickCreationResult | null = null;
  const allBricks: Brick[] = [];
  const allUnlocks: UnlockEvent[] = [];

  for (const chunk of chunks) {
    latest = await addBrickToCategory(
      session.categoryId,
      session.brickColor,
      chunk,
      session.id,
      false,
    );
    allBricks.push(...latest.bricks);
    allUnlocks.push(...latest.unlocks);
  }

  return latest
    ? { bricks: allBricks, unlocks: allUnlocks, category: latest.category }
    : null;
}

export async function logResistBrick(categoryId: string): Promise<BrickCreationResult> {
  const category = await getCategoryById(categoryId).then(
    (row) => row ?? waitForCategory(categoryId),
  );
  const isMiniature = category.type === 'miniature';
  return addBrickToCategory(categoryId, category.defaultColor, 1, null, isMiniature);
}

/** @deprecated Use logResistBrick */
export async function logMiniatureResist(categoryId: string): Promise<BrickCreationResult> {
  return logResistBrick(categoryId);
}

export async function logResistBrickWithRetry(
  categoryId: string,
  maxAttempts = 8,
): Promise<BrickCreationResult> {
  return withDbRetry(() => logResistBrick(categoryId), maxAttempts);
}

/** @deprecated Use logResistBrickWithRetry */
export async function logMiniatureResistWithRetry(
  categoryId: string,
  maxAttempts = 8,
): Promise<BrickCreationResult> {
  return logResistBrickWithRetry(categoryId, maxAttempts);
}

export async function sealDailyBuild(categoryId: string, date: string): Promise<UnlockEvent | null> {
  const daily = await getOrCreateDailyBuild(categoryId, date);
  if (daily.sealed) return null;

  const tier = getDailyStructureForBrickValue(daily.brickValueToday);
  daily.sealed = true;
  daily.structureKey = tier?.key ?? null;
  await updateDailyBuild(daily);

  if (!tier) return null;

  return {
    type: 'daily',
    stageKey: tier.key,
    stageName: tier.name,
    cumulativeBricks: daily.brickValueToday,
    categoryBrickTotal: daily.brickValueToday,
  };
}

export async function sealAllPendingDailyBuilds(): Promise<UnlockEvent[]> {
  const categories = await getAllCategories();
  const today = todayLocalDate();
  const unlocks: UnlockEvent[] = [];

  for (const cat of categories) {
    if (cat.type !== 'standard') continue;
    const event = await sealDailyBuild(cat.id, today);
    if (event) unlocks.push(event);
  }
  return unlocks;
}
