import type {
  Brick,
  BuildingInstance,
  Category,
  DailyBuild,
  FocusSession,
  UserSettings,
} from '@/types';

export interface SettlementScene {
  category: Category;
  bricks: Brick[];
  buildings: BuildingInstance[];
  dailyBuild: DailyBuild | null;
}

export interface RenderOptions {
  width: number;
  height: number;
  scale?: number;
  highlightBrickId?: string | null;
  selectedBuildingId?: string | null;
}

export interface HitTestResult {
  type: 'brick' | 'building';
  brick?: Brick;
  building?: BuildingInstance;
}

/**
 * Primary renderer: Three.js via @react-three/fiber (3D).
 * Legacy 2D Skia path removed — game logic stays renderer-agnostic.
 */
export interface SettlementRenderer {
  readonly mode: '3d';
  hitTest(scene: SettlementScene, x: number, y: number, options: RenderOptions): HitTestResult | null;
}

export const BRICK_CELL = 28;
export const BRICK_GAP = 2;
export const GRID_COLUMNS = 10;
