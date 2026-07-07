import type { Category, CategoryType, UserSettings, FocusMode, AmbientSound } from '@/types';
import { getDatabase } from './db';
import { withDbWrite } from './dbQueue';
import { generateId, normalizeColor } from '@/utils';

interface CategoryRow {
  id: string;
  name: string;
  default_color: string;
  icon: string;
  type: CategoryType;
  sort_order: number;
  is_hidden: number;
  total_brick_value: number;
  current_stage_index: number;
  current_streak: number;
  longest_streak: number;
  last_brick_date: string | null;
  daily_goal_hours: number;
  created_at: string;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    defaultColor: row.default_color,
    icon: row.icon,
    type: row.type,
    sortOrder: row.sort_order,
    isHidden: row.is_hidden === 1,
    totalBrickValue: row.total_brick_value,
    currentStageIndex: row.current_stage_index,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastBrickDate: row.last_brick_date,
    dailyGoalHours: row.daily_goal_hours ?? 1,
    createdAt: row.created_at,
  };
}

export async function getAllCategories(includeHidden = false): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRow>(
    includeHidden
      ? 'SELECT * FROM categories ORDER BY sort_order ASC, created_at ASC'
      : 'SELECT * FROM categories WHERE is_hidden = 0 ORDER BY sort_order ASC, created_at ASC',
  );
  return rows.map(mapCategory);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', [id]);
  return row ? mapCategory(row) : null;
}

export async function createCategory(input: {
  name: string;
  defaultColor: string;
  type: CategoryType;
  icon?: string;
}): Promise<Category> {
  return withDbWrite(async () => {
    const db = await getDatabase();
    const count = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM categories');
    const category: Category = {
      id: generateId(),
      name: input.name.trim(),
      defaultColor: normalizeColor(input.defaultColor),
      icon: input.icon ?? (input.type === 'miniature' ? 'seedling' : 'castle'),
      type: input.type,
      sortOrder: count?.c ?? 0,
      isHidden: false,
      totalBrickValue: 0,
      currentStageIndex: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastBrickDate: null,
      dailyGoalHours: 1,
      createdAt: new Date().toISOString(),
    };
    await db.runAsync(
      `INSERT INTO categories (id, name, default_color, icon, type, sort_order, is_hidden,
      total_brick_value, current_stage_index, current_streak, longest_streak, last_brick_date, daily_goal_hours, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, NULL, 1, ?)`,
      [
        category.id,
        category.name,
        category.defaultColor,
        category.icon,
        category.type,
        category.sortOrder,
        category.createdAt,
      ],
    );
    return category;
  });
}

export async function updateCategory(category: Category): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE categories SET name=?, default_color=?, icon=?, type=?, sort_order=?, is_hidden=?,
      total_brick_value=?, current_stage_index=?, current_streak=?, longest_streak=?, last_brick_date=?, daily_goal_hours=?
     WHERE id=?`,
    [
      category.name,
      category.defaultColor,
      category.icon,
      category.type,
      category.sortOrder,
      category.isHidden ? 1 : 0,
      category.totalBrickValue,
      category.currentStageIndex,
      category.currentStreak,
      category.longestStreak,
      category.lastBrickDate,
      category.dailyGoalHours,
      category.id,
    ],
  );
}

/** Atomically add brick value — safe under rapid taps. */
export async function incrementCategoryAfterBrick(
  categoryId: string,
  brickDelta: number,
  fields: {
    currentStageIndex: number;
    currentStreak: number;
    longestStreak: number;
    lastBrickDate: string;
  },
): Promise<number> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE categories SET total_brick_value = total_brick_value + ?,
      current_stage_index = ?, current_streak = ?, longest_streak = ?, last_brick_date = ?
     WHERE id = ?`,
    [
      brickDelta,
      fields.currentStageIndex,
      fields.currentStreak,
      fields.longestStreak,
      fields.lastBrickDate,
      categoryId,
    ],
  );
  const row = await db.getFirstAsync<{ total_brick_value: number }>(
    'SELECT total_brick_value FROM categories WHERE id = ?',
    [categoryId],
  );
  return row?.total_brick_value ?? 0;
}

export async function updateCategoryDailyGoal(
  categoryId: string,
  dailyGoalHours: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE categories SET daily_goal_hours = ? WHERE id = ?', [
    Math.max(0, dailyGoalHours),
    categoryId,
  ]);
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM bricks WHERE category_id = ?', [id]);
  await db.runAsync('DELETE FROM building_instances WHERE category_id = ?', [id]);
  await db.runAsync('DELETE FROM daily_builds WHERE category_id = ?', [id]);
  await db.runAsync('DELETE FROM sessions WHERE category_id = ?', [id]);
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

interface SettingsRow {
  focus_mode: FocusMode;
  fractional_bricks_enabled: number;
  ambient_sound: AmbientSound;
  sfx_enabled: number;
  haptics_enabled: number;
}

export async function getSettings(): Promise<UserSettings> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SettingsRow>('SELECT * FROM settings WHERE id = 1');
  return {
    focusMode: row?.focus_mode ?? 'soft',
    fractionalBricksEnabled: (row?.fractional_bricks_enabled ?? 1) === 1,
    ambientSound: row?.ambient_sound ?? 'none',
    sfxEnabled: (row?.sfx_enabled ?? 1) === 1,
    hapticsEnabled: (row?.haptics_enabled ?? 1) === 1,
  };
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE settings SET focus_mode=?, fractional_bricks_enabled=?, ambient_sound=?,
      sfx_enabled=?, haptics_enabled=? WHERE id=1`,
    [
      settings.focusMode,
      settings.fractionalBricksEnabled ? 1 : 0,
      settings.ambientSound,
      settings.sfxEnabled ? 1 : 0,
      settings.hapticsEnabled ? 1 : 0,
    ],
  );
}
