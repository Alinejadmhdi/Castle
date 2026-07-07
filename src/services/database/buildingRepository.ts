import type { BuildingInstance, DailyBuild } from '@/types';
import { clearBricksBuildingAssignment } from './brickRepository';
import { getDatabase } from './db';

interface BuildingRow {
  id: string;
  category_id: string;
  kind: BuildingInstance['kind'];
  stage_key: string;
  name: string;
  brick_ids: string;
  total_brick_value: number;
  plot_x: number;
  plot_y: number;
  scale: number;
  unlocked_at: string;
  parent_compound_id: string | null;
  source_instance_ids: string;
}

function mapBuilding(row: BuildingRow): BuildingInstance {
  return {
    id: row.id,
    categoryId: row.category_id,
    kind: row.kind,
    stageKey: row.stage_key,
    name: row.name,
    brickIds: JSON.parse(row.brick_ids) as string[],
    totalBrickValue: row.total_brick_value,
    plotX: row.plot_x,
    plotY: row.plot_y,
    scale: row.scale,
    unlockedAt: row.unlocked_at,
    parentCompoundId: row.parent_compound_id,
    sourceInstanceIds: JSON.parse(row.source_instance_ids) as string[],
  };
}

export async function insertBuildingInstance(building: BuildingInstance): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO building_instances (id, category_id, kind, stage_key, name, brick_ids,
      total_brick_value, plot_x, plot_y, scale, unlocked_at, parent_compound_id, source_instance_ids)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      building.id,
      building.categoryId,
      building.kind,
      building.stageKey,
      building.name,
      JSON.stringify(building.brickIds),
      building.totalBrickValue,
      building.plotX,
      building.plotY,
      building.scale,
      building.unlockedAt,
      building.parentCompoundId,
      JSON.stringify(building.sourceInstanceIds),
    ],
  );
}

export async function getBuildingCount(categoryId: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM building_instances WHERE category_id = ?',
    [categoryId],
  );
  return row?.c ?? 0;
}

export async function getBuildingsByCategory(categoryId: string): Promise<BuildingInstance[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<BuildingRow>(
    'SELECT * FROM building_instances WHERE category_id = ? ORDER BY unlocked_at ASC',
    [categoryId],
  );
  return rows.map(mapBuilding);
}

export async function getSubBuildingsByKey(
  categoryId: string,
  stageKey: string,
): Promise<BuildingInstance[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<BuildingRow>(
    `SELECT * FROM building_instances WHERE category_id = ? AND kind = 'sub' AND stage_key = ?`,
    [categoryId, stageKey],
  );
  return rows.map(mapBuilding);
}

interface DailyRow {
  id: string;
  category_id: string;
  date: string;
  brick_value_today: number;
  starting_brick_value: number;
  brick_ids: string;
  structure_key: string | null;
  sealed: number;
}

function mapDaily(row: DailyRow): DailyBuild {
  return {
    id: row.id,
    categoryId: row.category_id,
    date: row.date,
    brickValueToday: row.brick_value_today,
    startingBrickValue: row.starting_brick_value ?? 0,
    brickIds: JSON.parse(row.brick_ids) as string[],
    structureKey: row.structure_key,
    sealed: row.sealed === 1,
  };
}

export async function getOrCreateDailyBuild(
  categoryId: string,
  date: string,
  startingBrickValue = 0,
): Promise<DailyBuild> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<DailyRow>(
    'SELECT * FROM daily_builds WHERE category_id = ? AND date = ?',
    [categoryId, date],
  );
  if (existing) return mapDaily(existing);

  const daily: DailyBuild = {
    id: `daily-${categoryId}-${date}`,
    categoryId,
    date,
    brickValueToday: 0,
    startingBrickValue,
    brickIds: [],
    structureKey: null,
    sealed: false,
  };
  await db.runAsync(
    `INSERT INTO daily_builds (id, category_id, date, brick_value_today, starting_brick_value, brick_ids, structure_key, sealed)
     VALUES (?, ?, ?, 0, ?, '[]', NULL, 0)`,
    [daily.id, categoryId, date, startingBrickValue],
  );
  return daily;
}

export async function updateDailyBuild(daily: DailyBuild): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE daily_builds SET brick_value_today=?, starting_brick_value=?, brick_ids=?, structure_key=?, sealed=? WHERE id=?`,
    [
      daily.brickValueToday,
      daily.startingBrickValue,
      JSON.stringify(daily.brickIds),
      daily.structureKey,
      daily.sealed ? 1 : 0,
      daily.id,
    ],
  );
}

export async function updateBuildingPlotPosition(
  buildingId: string,
  plotX: number,
  plotY: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE building_instances SET plot_x = ?, plot_y = ? WHERE id = ?',
    [plotX, plotY, buildingId],
  );
}

export async function deleteBuildingInstance(buildingId: string): Promise<void> {
  const db = await getDatabase();
  await clearBricksBuildingAssignment(buildingId);
  await db.runAsync('DELETE FROM building_instances WHERE id = ?', [buildingId]);
}

export async function deletePlotMonumentsForCategory(
  categoryId: string,
  kind: 'macro' | 'miniature',
): Promise<void> {
  const existing = await getBuildingsByCategory(categoryId);
  const toDelete = existing.filter((b) => b.kind === kind);
  for (const building of toDelete) {
    await deleteBuildingInstance(building.id);
  }
}

export async function deleteAllDailyBuildingInstances(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM building_instances WHERE kind = 'daily'`);
}

export async function getDailyBuild(
  categoryId: string,
  date: string,
): Promise<DailyBuild | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DailyRow>(
    'SELECT * FROM daily_builds WHERE category_id = ? AND date = ?',
    [categoryId, date],
  );
  return row ? mapDaily(row) : null;
}

export async function getBuildingById(id: string): Promise<BuildingInstance | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<BuildingRow>(
    'SELECT * FROM building_instances WHERE id = ?',
    [id],
  );
  return row ? mapBuilding(row) : null;
}

export async function getDailyBuildsForDate(date: string): Promise<DailyBuild[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DailyRow>(
    'SELECT * FROM daily_builds WHERE date = ?',
    [date],
  );
  return rows.map(mapDaily);
}

export async function getUnsealedDailyBuildsBefore(date: string): Promise<DailyBuild[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DailyRow>(
    'SELECT * FROM daily_builds WHERE sealed = 0 AND date < ? ORDER BY date ASC',
    [date],
  );
  return rows.map(mapDaily);
}
