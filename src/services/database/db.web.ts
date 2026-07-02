import { CREATE_TABLES_SQL, DEFAULT_SETTINGS, SCHEMA_VERSION } from './schema';
import type { Category, Brick, FocusSession, BuildingInstance, DailyBuild, UserSettings } from '@/types';

const STORAGE_KEY = 'lifescastle_v1';

interface Store {
  settings: UserSettings & { id: number };
  categories: Category[];
  sessions: FocusSession[];
  bricks: Brick[];
  building_instances: BuildingInstance[];
  daily_builds: DailyBuild[];
  schema_version: number;
}

function defaultSettings(): Store['settings'] {
  return {
    id: 1,
    focusMode: 'soft',
    fractionalBricksEnabled: true,
    ambientSound: 'none',
    sfxEnabled: true,
    hapticsEnabled: true,
  };
}

function loadStore(): Store {
  if (typeof localStorage === 'undefined') {
    return emptyStore();
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyStore();
  try {
    return JSON.parse(raw) as Store;
  } catch {
    return emptyStore();
  }
}

function emptyStore(): Store {
  return {
    settings: defaultSettings(),
    categories: [],
    sessions: [],
    bricks: [],
    building_instances: [],
    daily_builds: [],
    schema_version: SCHEMA_VERSION,
  };
}

function saveStore(store: Store) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
}

let store = loadStore();

export type WebDatabase = {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (sql: string, params?: unknown[]) => Promise<{ changes: number }>;
  getFirstAsync: <T>(sql: string, params?: unknown[]) => Promise<T | null>;
  getAllAsync: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
  closeAsync: () => Promise<void>;
};

function categoryToRow(c: Category) {
  return {
    id: c.id,
    name: c.name,
    default_color: c.defaultColor,
    icon: c.icon,
    type: c.type,
    sort_order: c.sortOrder,
    is_hidden: c.isHidden ? 1 : 0,
    total_brick_value: c.totalBrickValue,
    current_stage_index: c.currentStageIndex,
    current_streak: c.currentStreak,
    longest_streak: c.longestStreak,
    last_brick_date: c.lastBrickDate,
    created_at: c.createdAt,
  };
}

function mapCategoryRow(row: ReturnType<typeof categoryToRow>): Category {
  return {
    id: row.id,
    name: row.name,
    defaultColor: row.default_color,
    icon: row.icon,
    type: row.type as Category['type'],
    sortOrder: row.sort_order,
    isHidden: row.is_hidden === 1,
    totalBrickValue: row.total_brick_value,
    currentStageIndex: row.current_stage_index,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastBrickDate: row.last_brick_date,
    createdAt: row.created_at,
  };
}

function runQuery(sql: string, params: unknown[] = []): number {
  const p = params;
  saveStore(store);

  if (sql.startsWith('INSERT INTO categories')) {
    const cat = mapCategoryRow({
      id: p[0] as string,
      name: p[1] as string,
      default_color: p[2] as string,
      icon: p[3] as string,
      type: p[4] as Category['type'],
      sort_order: p[5] as number,
      is_hidden: 0,
      total_brick_value: 0,
      current_stage_index: 0,
      current_streak: 0,
      longest_streak: 0,
      last_brick_date: null,
      created_at: p[6] as string,
    });
    store.categories.push(cat);
    saveStore(store);
    return 1;
  }

  if (sql.includes('UPDATE categories SET')) {
    const id = p[p.length - 1] as string;
    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx >= 0) {
      const c = store.categories[idx];
      store.categories[idx] = {
        ...c,
        name: p[0] as string,
        defaultColor: p[1] as string,
        icon: p[2] as string,
        type: p[3] as Category['type'],
        sortOrder: p[4] as number,
        isHidden: p[5] === 1,
        totalBrickValue: p[6] as number,
        currentStageIndex: p[7] as number,
        currentStreak: p[8] as number,
        longestStreak: p[9] as number,
        lastBrickDate: p[10] as string | null,
      };
      saveStore(store);
    }
    return 1;
  }

  if (sql.startsWith('DELETE FROM bricks')) {
    store.bricks = store.bricks.filter((b) => b.categoryId !== p[0]);
    saveStore(store);
    return 1;
  }
  if (sql.includes("DELETE FROM building_instances WHERE kind = 'daily'")) {
    store.building_instances = store.building_instances.filter((b) => b.kind !== 'daily');
    saveStore(store);
    return store.building_instances.length;
  }
  if (sql.startsWith('DELETE FROM building_instances WHERE id = ?')) {
    const id = p[0] as string;
    store.building_instances = store.building_instances.filter((b) => b.id !== id);
    saveStore(store);
    return 1;
  }
  if (sql.startsWith('DELETE FROM building_instances')) {
    store.building_instances = store.building_instances.filter((b) => b.categoryId !== p[0]);
    saveStore(store);
    return 1;
  }
  if (sql.startsWith('DELETE FROM daily_builds')) {
    store.daily_builds = store.daily_builds.filter((b) => b.categoryId !== p[0]);
    saveStore(store);
    return 1;
  }
  if (sql.startsWith('DELETE FROM sessions')) {
    store.sessions = store.sessions.filter((s) => s.categoryId !== p[0]);
    saveStore(store);
    return 1;
  }
  if (sql.startsWith('DELETE FROM categories')) {
    store.categories = store.categories.filter((c) => c.id !== p[0]);
    saveStore(store);
    return 1;
  }

  if (sql.includes('UPDATE bricks SET building_instance_id = NULL WHERE building_instance_id')) {
    const buildingInstanceId = p[0] as string;
    store.bricks = store.bricks.map((b) =>
      b.buildingInstanceId === buildingInstanceId
        ? { ...b, buildingInstanceId: null }
        : b,
    );
    saveStore(store);
    return 1;
  }
  if (sql.includes('UPDATE bricks SET building_instance_id')) {
    const buildingInstanceId = p[0] as string;
    const brickId = p[1] as string;
    const idx = store.bricks.findIndex((b) => b.id === brickId);
    if (idx >= 0) {
      store.bricks[idx] = {
        ...store.bricks[idx],
        buildingInstanceId,
      };
      saveStore(store);
    }
    return 1;
  }

  if (sql.startsWith('INSERT INTO bricks')) {
    store.bricks.push({
      id: p[0] as string,
      categoryId: p[1] as string,
      color: p[2] as string,
      sessionId: p[3] as string | null,
      fractionalValue: p[4] as number,
      globalIndex: p[5] as number,
      stageIndex: p[6] as number,
      positionInStage: p[7] as number,
      dailyBuildId: p[8] as string | null,
      buildingInstanceId: p[9] as string | null,
      gridX: p[10] as number,
      gridY: p[11] as number,
      streakRewardLabel: p[12] as number | null,
      completedAt: p[13] as string,
      isMiniature: p[14] === 1,
    });
    saveStore(store);
    return 1;
  }

  if (sql.startsWith('INSERT INTO sessions')) {
    store.sessions.push({
      id: p[0] as string,
      categoryId: p[1] as string,
      brickColor: p[2] as string,
      plannedDurationMs: p[3] as number,
      elapsedMs: p[4] as number,
      startedAt: p[5] as string,
      endedAt: p[6] as string | null,
      status: p[7] as FocusSession['status'],
      pauseCount: p[8] as number,
      bricksEarned: p[9] as number,
    });
    saveStore(store);
    return 1;
  }

  if (sql.includes('UPDATE sessions SET')) {
    const id = p[p.length - 1] as string;
    const idx = store.sessions.findIndex((s) => s.id === id);
    if (idx >= 0) {
      store.sessions[idx] = {
        ...store.sessions[idx],
        elapsedMs: p[0] as number,
        endedAt: p[1] as string | null,
        status: p[2] as FocusSession['status'],
        pauseCount: p[3] as number,
        bricksEarned: p[4] as number,
      };
      saveStore(store);
    }
    return 1;
  }

  if (sql.startsWith('INSERT INTO building_instances')) {
    store.building_instances.push({
      id: p[0] as string,
      categoryId: p[1] as string,
      kind: p[2] as BuildingInstance['kind'],
      stageKey: p[3] as string,
      name: p[4] as string,
      brickIds: JSON.parse(p[5] as string),
      totalBrickValue: p[6] as number,
      plotX: p[7] as number,
      plotY: p[8] as number,
      scale: p[9] as number,
      unlockedAt: p[10] as string,
      parentCompoundId: p[11] as string | null,
      sourceInstanceIds: JSON.parse(p[12] as string),
    });
    saveStore(store);
    return 1;
  }

  if (sql.includes('UPDATE building_instances SET plot_x')) {
    const plotX = p[0] as number;
    const plotY = p[1] as number;
    const id = p[2] as string;
    const building = store.building_instances.find((b) => b.id === id);
    if (building) {
      building.plotX = plotX;
      building.plotY = plotY;
      saveStore(store);
    }
    return 1;
  }

  if (sql.startsWith('INSERT INTO daily_builds')) {
    store.daily_builds.push({
      id: p[0] as string,
      categoryId: p[1] as string,
      date: p[2] as string,
      brickValueToday: 0,
      brickIds: [],
      structureKey: null,
      sealed: false,
    });
    saveStore(store);
    return 1;
  }

  if (sql.includes('UPDATE daily_builds SET')) {
    const id = p[p.length - 1] as string;
    const idx = store.daily_builds.findIndex((d) => d.id === id);
    if (idx >= 0) {
      store.daily_builds[idx] = {
        ...store.daily_builds[idx],
        brickValueToday: p[0] as number,
        brickIds: JSON.parse(p[1] as string),
        structureKey: p[2] as string | null,
        sealed: p[3] === 1,
      };
      saveStore(store);
    }
    return 1;
  }

  if (sql.includes('UPDATE settings SET')) {
    store.settings = {
      id: 1,
      focusMode: p[0] as UserSettings['focusMode'],
      fractionalBricksEnabled: p[1] === 1,
      ambientSound: p[2] as UserSettings['ambientSound'],
      sfxEnabled: p[3] === 1,
      hapticsEnabled: p[4] === 1,
    };
    saveStore(store);
    return 1;
  }

  if (sql.startsWith('INSERT INTO schema_version')) {
    store.schema_version = p[0] as number;
    saveStore(store);
    return 1;
  }

  return 0;
}

function selectQuery<T>(sql: string, params: unknown[] = []): T[] {
  if (sql.includes('FROM categories WHERE is_hidden = 0')) {
    return store.categories
      .filter((c) => !c.isHidden)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt))
      .map(categoryToRow) as T[];
  }
  if (sql.includes('FROM categories ORDER BY')) {
    return store.categories
      .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt))
      .map(categoryToRow) as T[];
  }
  if (sql.includes('FROM categories WHERE id = ?')) {
    const c = store.categories.find((x) => x.id === params[0]);
    return c ? ([categoryToRow(c)] as T[]) : [];
  }
  if (sql.includes('SELECT COUNT(*) as c FROM categories')) {
    return [{ c: store.categories.length }] as T[];
  }
  if (sql.includes('FROM settings WHERE id = 1')) {
    const s = store.settings;
    return [
      {
        focus_mode: s.focusMode,
        fractional_bricks_enabled: s.fractionalBricksEnabled ? 1 : 0,
        ambient_sound: s.ambientSound,
        sfx_enabled: s.sfxEnabled ? 1 : 0,
        haptics_enabled: s.hapticsEnabled ? 1 : 0,
      },
    ] as T[];
  }
  if (sql.includes('FROM bricks WHERE category_id = ? ORDER BY')) {
    return store.bricks
      .filter((b) => b.categoryId === params[0])
      .sort((a, b) => a.globalIndex - b.globalIndex)
      .map((b) => ({
        id: b.id,
        category_id: b.categoryId,
        color: b.color,
        session_id: b.sessionId,
        fractional_value: b.fractionalValue,
        global_index: b.globalIndex,
        stage_index: b.stageIndex,
        position_in_stage: b.positionInStage,
        daily_build_id: b.dailyBuildId,
        building_instance_id: b.buildingInstanceId,
        grid_x: b.gridX,
        grid_y: b.gridY,
        streak_reward_label: b.streakRewardLabel,
        completed_at: b.completedAt,
        is_miniature: b.isMiniature ? 1 : 0,
      })) as T[];
  }
  if (sql.includes('FROM bricks WHERE id = ?')) {
    const b = store.bricks.find((x) => x.id === params[0]);
    if (!b) return [];
    return [
      {
        id: b.id,
        category_id: b.categoryId,
        color: b.color,
        session_id: b.sessionId,
        fractional_value: b.fractionalValue,
        global_index: b.globalIndex,
        stage_index: b.stageIndex,
        position_in_stage: b.positionInStage,
        daily_build_id: b.dailyBuildId,
        building_instance_id: b.buildingInstanceId,
        grid_x: b.gridX,
        grid_y: b.gridY,
        streak_reward_label: b.streakRewardLabel,
        completed_at: b.completedAt,
        is_miniature: b.isMiniature ? 1 : 0,
      },
    ] as T[];
  }
  if (sql.includes('COUNT(*) as c FROM bricks WHERE category_id = ? AND stage_index')) {
    const categoryId = params[0] as string;
    const stageIndex = params[1] as number;
    return [
      {
        c: store.bricks.filter(
          (b) => b.categoryId === categoryId && b.stageIndex === stageIndex,
        ).length,
      },
    ] as T[];
  }
  if (sql.includes('COUNT(*) as c FROM bricks WHERE category_id')) {
    return [{ c: store.bricks.filter((b) => b.categoryId === params[0]).length }] as T[];
  }
  if (sql.includes("status IN ('active', 'paused')")) {
    const s = store.sessions.find((x) => x.status === 'active' || x.status === 'paused');
    if (!s) return [];
    return [
      {
        id: s.id,
        category_id: s.categoryId,
        brick_color: s.brickColor,
        planned_duration_ms: s.plannedDurationMs,
        elapsed_ms: s.elapsedMs,
        started_at: s.startedAt,
        ended_at: s.endedAt,
        status: s.status,
        pause_count: s.pauseCount,
        bricks_earned: s.bricksEarned,
      },
    ] as T[];
  }
  if (sql.includes('FROM sessions WHERE category_id = ? ORDER BY')) {
    return store.sessions
      .filter((s) => s.categoryId === params[0])
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .map((s) => ({
        id: s.id,
        category_id: s.categoryId,
        brick_color: s.brickColor,
        planned_duration_ms: s.plannedDurationMs,
        elapsed_ms: s.elapsedMs,
        started_at: s.startedAt,
        ended_at: s.endedAt,
        status: s.status,
        pause_count: s.pauseCount,
        bricks_earned: s.bricksEarned,
      })) as T[];
  }
  if (sql.includes('FROM sessions ORDER BY')) {
    return store.sessions
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .map((s) => ({
        id: s.id,
        category_id: s.categoryId,
        brick_color: s.brickColor,
        planned_duration_ms: s.plannedDurationMs,
        elapsed_ms: s.elapsedMs,
        started_at: s.startedAt,
        ended_at: s.endedAt,
        status: s.status,
        pause_count: s.pauseCount,
        bricks_earned: s.bricksEarned,
      })) as T[];
  }
  if (sql.includes('FROM building_instances WHERE category_id = ? ORDER BY')) {
    return store.building_instances
      .filter((b) => b.categoryId === params[0])
      .sort((a, b) => a.unlockedAt.localeCompare(b.unlockedAt))
      .map((b) => ({
        id: b.id,
        category_id: b.categoryId,
        kind: b.kind,
        stage_key: b.stageKey,
        name: b.name,
        brick_ids: JSON.stringify(b.brickIds),
        total_brick_value: b.totalBrickValue,
        plot_x: b.plotX,
        plot_y: b.plotY,
        scale: b.scale,
        unlocked_at: b.unlockedAt,
        parent_compound_id: b.parentCompoundId,
        source_instance_ids: JSON.stringify(b.sourceInstanceIds),
      })) as T[];
  }
  if (sql.includes("kind = 'sub' AND stage_key")) {
    return store.building_instances
      .filter(
        (b) => b.categoryId === params[0] && b.kind === 'sub' && b.stageKey === params[1],
      )
      .map((b) => ({
        id: b.id,
        category_id: b.categoryId,
        kind: b.kind,
        stage_key: b.stageKey,
        name: b.name,
        brick_ids: JSON.stringify(b.brickIds),
        total_brick_value: b.totalBrickValue,
        plot_x: b.plotX,
        plot_y: b.plotY,
        scale: b.scale,
        unlocked_at: b.unlockedAt,
        parent_compound_id: b.parentCompoundId,
        source_instance_ids: JSON.stringify(b.sourceInstanceIds),
      })) as T[];
  }
  if (sql.includes('FROM daily_builds WHERE category_id = ? AND date = ?')) {
    const d = store.daily_builds.find(
      (x) => x.categoryId === params[0] && x.date === params[1],
    );
    if (!d) return [];
    return [
      {
        id: d.id,
        category_id: d.categoryId,
        date: d.date,
        brick_value_today: d.brickValueToday,
        brick_ids: JSON.stringify(d.brickIds),
        structure_key: d.structureKey,
        sealed: d.sealed ? 1 : 0,
      },
    ] as T[];
  }
  if (sql.includes('FROM schema_version')) {
    return [{ version: store.schema_version }] as T[];
  }
  return [];
}

const webDb: WebDatabase = {
  async execAsync(_sql: string) {
    void CREATE_TABLES_SQL;
    void DEFAULT_SETTINGS;
    if (!store.settings) store.settings = defaultSettings();
    saveStore(store);
  },
  async runAsync(sql: string, params: unknown[] = []) {
    const changes = runQuery(sql, params);
    return { changes };
  },
  async getFirstAsync<T>(sql: string, params: unknown[] = []) {
    const rows = selectQuery<T>(sql, params);
    return rows[0] ?? null;
  },
  async getAllAsync<T>(sql: string, params: unknown[] = []) {
    return selectQuery<T>(sql, params);
  },
  async closeAsync() {},
};

let initialized = false;

export async function getDatabase(): Promise<WebDatabase> {
  if (!initialized) {
    store = loadStore();
    if (!store.settings?.id) store.settings = defaultSettings();
    initialized = true;
  }
  return webDb;
}

export async function resetDatabase(): Promise<void> {
  store = emptyStore();
  saveStore(store);
  initialized = true;
}
