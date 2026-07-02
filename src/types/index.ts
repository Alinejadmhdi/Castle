export type FocusMode = 'strict' | 'soft';
export type CategoryType = 'standard' | 'miniature';
export type SessionStatus = 'active' | 'completed' | 'abandoned' | 'paused';
export type BuildingKind = 'macro' | 'daily' | 'compound' | 'sub' | 'miniature';
export type AmbientSound = 'rain' | 'fire' | 'wind' | 'none';

export interface Category {
  id: string;
  name: string;
  defaultColor: string;
  icon: string;
  type: CategoryType;
  sortOrder: number;
  isHidden: boolean;
  totalBrickValue: number;
  currentStageIndex: number;
  currentStreak: number;
  longestStreak: number;
  lastBrickDate: string | null;
  createdAt: string;
}

export interface Brick {
  id: string;
  categoryId: string;
  color: string;
  sessionId: string | null;
  fractionalValue: number;
  globalIndex: number;
  stageIndex: number;
  positionInStage: number;
  dailyBuildId: string | null;
  buildingInstanceId: string | null;
  gridX: number;
  gridY: number;
  streakRewardLabel: number | null;
  completedAt: string;
  isMiniature: boolean;
}

export interface FocusSession {
  id: string;
  categoryId: string;
  brickColor: string;
  plannedDurationMs: number;
  elapsedMs: number;
  startedAt: string;
  endedAt: string | null;
  status: SessionStatus;
  pauseCount: number;
  bricksEarned: number;
}

export interface BuildingInstance {
  id: string;
  categoryId: string;
  kind: BuildingKind;
  stageKey: string;
  name: string;
  brickIds: string[];
  totalBrickValue: number;
  plotX: number;
  plotY: number;
  scale: number;
  unlockedAt: string;
  parentCompoundId: string | null;
  sourceInstanceIds: string[];
}

export interface DailyBuild {
  id: string;
  categoryId: string;
  date: string;
  brickValueToday: number;
  brickIds: string[];
  structureKey: string | null;
  sealed: boolean;
}

export interface UserSettings {
  focusMode: FocusMode;
  fractionalBricksEnabled: boolean;
  ambientSound: AmbientSound;
  sfxEnabled: boolean;
  hapticsEnabled: boolean;
}

export interface BuildingStage {
  index: number;
  key: string;
  name: string;
  cumulativeBricks: number;
  stageBrickCount: number;
  templateId: string;
  usesCompoundFill: boolean;
}

export interface DailyBuildingTier {
  key: string;
  name: string;
  minHours: number;
  maxHours: number;
  brickValue: number;
}

export interface CompoundRule {
  subKey: string;
  subName: string;
  subBrickCount: number;
  combineCount: number;
  compoundKey: string;
  compoundName: string;
  minStageBrickCount: number;
}

export interface StreakMilestone {
  days: number;
  label: string;
  badgeColor: string;
}

export interface UnlockEvent {
  type: 'macro' | 'daily' | 'compound' | 'miniature';
  buildingInstance?: BuildingInstance;
  stageKey: string;
  stageName: string;
  /** Cumulative brick threshold for this stage unlock. */
  cumulativeBricks: number;
  /** Category brick total when the unlock fired. */
  categoryBrickTotal: number;
}
