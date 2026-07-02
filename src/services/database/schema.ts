export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  focus_mode TEXT NOT NULL DEFAULT 'soft',
  fractional_bricks_enabled INTEGER NOT NULL DEFAULT 1,
  ambient_sound TEXT NOT NULL DEFAULT 'none',
  sfx_enabled INTEGER NOT NULL DEFAULT 1,
  haptics_enabled INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  default_color TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'castle',
  type TEXT NOT NULL DEFAULT 'standard',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  total_brick_value REAL NOT NULL DEFAULT 0,
  current_stage_index INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_brick_date TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  brick_color TEXT NOT NULL,
  planned_duration_ms INTEGER NOT NULL,
  elapsed_ms INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  status TEXT NOT NULL,
  pause_count INTEGER NOT NULL DEFAULT 0,
  bricks_earned REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bricks (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  color TEXT NOT NULL,
  session_id TEXT REFERENCES sessions(id),
  fractional_value REAL NOT NULL,
  global_index INTEGER NOT NULL,
  stage_index INTEGER NOT NULL,
  position_in_stage REAL NOT NULL,
  daily_build_id TEXT,
  building_instance_id TEXT,
  grid_x INTEGER NOT NULL,
  grid_y INTEGER NOT NULL,
  streak_reward_label INTEGER,
  completed_at TEXT NOT NULL,
  is_miniature INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS building_instances (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  kind TEXT NOT NULL,
  stage_key TEXT NOT NULL,
  name TEXT NOT NULL,
  brick_ids TEXT NOT NULL DEFAULT '[]',
  total_brick_value REAL NOT NULL,
  plot_x REAL NOT NULL DEFAULT 0,
  plot_y REAL NOT NULL DEFAULT 0,
  scale REAL NOT NULL DEFAULT 1,
  unlocked_at TEXT NOT NULL,
  parent_compound_id TEXT,
  source_instance_ids TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS daily_builds (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  date TEXT NOT NULL,
  brick_value_today REAL NOT NULL DEFAULT 0,
  brick_ids TEXT NOT NULL DEFAULT '[]',
  structure_key TEXT,
  sealed INTEGER NOT NULL DEFAULT 0,
  UNIQUE(category_id, date)
);

CREATE INDEX IF NOT EXISTS idx_bricks_category ON bricks(category_id);
CREATE INDEX IF NOT EXISTS idx_bricks_building ON bricks(building_instance_id);
CREATE INDEX IF NOT EXISTS idx_sessions_category ON sessions(category_id);
CREATE INDEX IF NOT EXISTS idx_daily_builds_category_date ON daily_builds(category_id, date);
`;

export const DEFAULT_SETTINGS = `
INSERT OR IGNORE INTO settings (id) VALUES (1);
`;
