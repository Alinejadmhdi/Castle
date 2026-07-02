import { MACRO_BUILDING_STAGES } from '@/constants/buildings';
import { getCompoundRuleForStageGap } from '@/constants/compoundBuildings';
import { getDailyStructureForBrickValue } from '@/constants/dailyBuildings';
import { MINIATURE_BUILDING_STAGES, MINIATURE_SCALE } from '@/constants/miniatureBuildings';
import {
  allocateBrickToStage,
  checkMacroStageUnlock,
  computeGridPosition,
  getStageForBrickValue,
} from '@/features/progression/progressionService';
import { updateStreak } from '@/features/streaks/streakService';
import type { Brick, BuildingInstance, Category, FocusSession, UnlockEvent } from '@/types';
import { generateId, msToBrickValue, todayLocalDate } from '@/utils';
import { getAllCategories } from '@/services/database/repositories';
import { insertBrick, getBrickCount, getBrickCountForStage, getBricksByCategory, assignBricksToBuilding } from '@/services/database/brickRepository';
import {
  getOrCreateDailyBuild,
  insertBuildingInstance,
  getBuildingsByCategory,
  getSubBuildingsByKey,
  updateDailyBuild,
} from '@/services/database/buildingRepository';
import { getMonumentPlotSlot } from '@/rendering/three/settlementLayout';
import { shouldPersistStageMonument } from '@/constants/monumentPersistence';
import { getCategoryById, updateCategory } from '@/services/database/repositories';

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
  const plotMonuments = existing.filter((b) => b.kind === 'macro' || b.kind === 'miniature');
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

  const stageInfo = allocateBrickToStage(newValue, category.type);
  const count = await getBrickCount(categoryId);
  const stageBrickCount = await getBrickCountForStage(categoryId, stageInfo.stage.index);
  const grid = computeGridPosition(stageBrickCount + 1);

  let dailyBuildId: string | null = null;
  if (!isMiniature && category.type === 'standard') {
    const daily = await getOrCreateDailyBuild(categoryId, today);
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
    stageIndex: stageInfo.stage.index,
    positionInStage: stageInfo.positionInStage,
    dailyBuildId,
    buildingInstanceId: null,
    gridX: grid.gridX,
    gridY: grid.gridY,
    streakRewardLabel: streakResult.rewardLabel,
    completedAt: new Date().toISOString(),
    isMiniature,
  };

  await insertBrick(brick);

  category.totalBrickValue = newValue;
  category.currentStageIndex = stageInfo.stage.index;
  category.currentStreak = streakResult.currentStreak;
  category.longestStreak = streakResult.longestStreak;
  category.lastBrickDate = streakResult.lastBrickDate;
  await updateCategory(category);

  const unlockedStage = checkMacroStageUnlock(previousValue, newValue, category.type);
  if (unlockedStage) {
    const stage = unlockedStage;
    const completedStageIndex = unlockedStage.index - 1;
    const monumentKind = category.type === 'miniature' ? 'miniature' : 'macro';

    if (shouldPersistStageMonument(category.type, unlockedStage.index)) {
      const categoryBricks = await getBricksByCategory(categoryId);
      const existingMonuments = (await getBuildingsByCategory(categoryId)).filter(
        (b) => b.kind === monumentKind,
      );

      if (!existingMonuments.some((b) => b.stageKey === stage.key)) {
        const absorbedBricks =
          completedStageIndex >= 0
            ? categoryBricks.filter(
                (b) => b.stageIndex === completedStageIndex && b.buildingInstanceId == null,
              )
            : [];
        const absorbedIds = absorbedBricks.map((b) => b.id);

        const instance = await createMacroBuildingInstance(
          category,
          stage.key,
          stage.name,
          monumentKind,
          absorbedIds.length > 0 ? absorbedIds : [brick.id],
          stage.cumulativeBricks,
          0,
          category.type === 'miniature' ? MINIATURE_SCALE : 1,
        );

        if (absorbedIds.length > 0) {
          await assignBricksToBuilding(absorbedIds, instance.id);
        }
        unlocks.push({
          type: category.type === 'miniature' ? 'miniature' : 'macro',
          buildingInstance: instance,
          stageKey: stage.key,
          stageName: stage.name,
          cumulativeBricks: stage.cumulativeBricks,
          categoryBrickTotal: newValue,
        });
      } else {
        unlocks.push({
          type: category.type === 'miniature' ? 'miniature' : 'macro',
          stageKey: stage.key,
          stageName: stage.name,
          cumulativeBricks: stage.cumulativeBricks,
          categoryBrickTotal: newValue,
        });
      }
    } else {
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

  return { bricks: [brick], unlocks, category };
}

export async function completeSessionBricks(
  session: FocusSession,
  elapsedMs: number,
  fractionalEnabled: boolean,
): Promise<BrickCreationResult | null> {
  const brickValue = msToBrickValue(elapsedMs, fractionalEnabled);
  if (brickValue <= 0) return null;
  return addBrickToCategory(session.categoryId, session.brickColor, brickValue, session.id, false);
}

export async function logMiniatureResist(categoryId: string): Promise<BrickCreationResult> {
  const category = await getCategoryById(categoryId);
  if (!category || category.type !== 'miniature') {
    throw new Error('Not a miniature category');
  }
  return addBrickToCategory(categoryId, category.defaultColor, 1, null, true);
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
