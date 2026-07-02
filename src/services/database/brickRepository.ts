import type { Brick, FocusSession, SessionStatus } from '@/types';
import { getDatabase } from './db';

interface BrickRow {
  id: string;
  category_id: string;
  color: string;
  session_id: string | null;
  fractional_value: number;
  global_index: number;
  stage_index: number;
  position_in_stage: number;
  daily_build_id: string | null;
  building_instance_id: string | null;
  grid_x: number;
  grid_y: number;
  streak_reward_label: number | null;
  completed_at: string;
  is_miniature: number;
}

function mapBrick(row: BrickRow): Brick {
  return {
    id: row.id,
    categoryId: row.category_id,
    color: row.color,
    sessionId: row.session_id,
    fractionalValue: row.fractional_value,
    globalIndex: row.global_index,
    stageIndex: row.stage_index,
    positionInStage: row.position_in_stage,
    dailyBuildId: row.daily_build_id,
    buildingInstanceId: row.building_instance_id,
    gridX: row.grid_x,
    gridY: row.grid_y,
    streakRewardLabel: row.streak_reward_label,
    completedAt: row.completed_at,
    isMiniature: row.is_miniature === 1,
  };
}

export async function insertBrick(brick: Brick): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO bricks (id, category_id, color, session_id, fractional_value, global_index,
      stage_index, position_in_stage, daily_build_id, building_instance_id, grid_x, grid_y,
      streak_reward_label, completed_at, is_miniature)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      brick.id,
      brick.categoryId,
      brick.color,
      brick.sessionId,
      brick.fractionalValue,
      brick.globalIndex,
      brick.stageIndex,
      brick.positionInStage,
      brick.dailyBuildId,
      brick.buildingInstanceId,
      brick.gridX,
      brick.gridY,
      brick.streakRewardLabel,
      brick.completedAt,
      brick.isMiniature ? 1 : 0,
    ],
  );
}

export async function getBricksByCategory(categoryId: string): Promise<Brick[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<BrickRow>(
    'SELECT * FROM bricks WHERE category_id = ? ORDER BY global_index ASC',
    [categoryId],
  );
  return rows.map(mapBrick);
}

export async function getBrickById(id: string): Promise<Brick | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<BrickRow>('SELECT * FROM bricks WHERE id = ?', [id]);
  return row ? mapBrick(row) : null;
}

export async function getBrickCount(categoryId: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM bricks WHERE category_id = ?',
    [categoryId],
  );
  return row?.c ?? 0;
}

export async function getBrickCountForStage(
  categoryId: string,
  stageIndex: number,
): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM bricks WHERE category_id = ? AND stage_index = ?',
    [categoryId, stageIndex],
  );
  return row?.c ?? 0;
}

export async function assignBricksToBuilding(
  brickIds: string[],
  buildingInstanceId: string,
): Promise<void> {
  if (brickIds.length === 0) return;
  const db = await getDatabase();
  for (const id of brickIds) {
    await db.runAsync('UPDATE bricks SET building_instance_id = ? WHERE id = ?', [
      buildingInstanceId,
      id,
    ]);
  }
}

export async function clearBricksBuildingAssignment(buildingInstanceId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE bricks SET building_instance_id = NULL WHERE building_instance_id = ?',
    [buildingInstanceId],
  );
}

interface SessionRow {
  id: string;
  category_id: string;
  brick_color: string;
  planned_duration_ms: number;
  elapsed_ms: number;
  started_at: string;
  ended_at: string | null;
  status: SessionStatus;
  pause_count: number;
  bricks_earned: number;
}

function mapSession(row: SessionRow): FocusSession {
  return {
    id: row.id,
    categoryId: row.category_id,
    brickColor: row.brick_color,
    plannedDurationMs: row.planned_duration_ms,
    elapsedMs: row.elapsed_ms,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    status: row.status,
    pauseCount: row.pause_count,
    bricksEarned: row.bricks_earned,
  };
}

export async function insertSession(session: FocusSession): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO sessions (id, category_id, brick_color, planned_duration_ms, elapsed_ms,
      started_at, ended_at, status, pause_count, bricks_earned)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.categoryId,
      session.brickColor,
      session.plannedDurationMs,
      session.elapsedMs,
      session.startedAt,
      session.endedAt,
      session.status,
      session.pauseCount,
      session.bricksEarned,
    ],
  );
}

export async function updateSession(session: FocusSession): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE sessions SET elapsed_ms=?, ended_at=?, status=?, pause_count=?, bricks_earned=? WHERE id=?`,
    [
      session.elapsedMs,
      session.endedAt,
      session.status,
      session.pauseCount,
      session.bricksEarned,
      session.id,
    ],
  );
}

export async function getActiveSession(): Promise<FocusSession | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionRow>(
    `SELECT * FROM sessions WHERE status IN ('active', 'paused') ORDER BY started_at DESC LIMIT 1`,
  );
  return row ? mapSession(row) : null;
}

export async function getSessionsByCategory(categoryId: string): Promise<FocusSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionRow>(
    'SELECT * FROM sessions WHERE category_id = ? ORDER BY started_at DESC',
    [categoryId],
  );
  return rows.map(mapSession);
}

export async function getAllSessions(): Promise<FocusSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionRow>(
    'SELECT * FROM sessions ORDER BY started_at DESC',
  );
  return rows.map(mapSession);
}
