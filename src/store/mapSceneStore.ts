import { create } from 'zustand';
import type { Brick, BuildingInstance } from '@/types';
import type { SceneBrickUpdate } from '@/components/map/MapActionPanel';
import { getBricksByCategory } from '@/services/database/brickRepository';
import { getBuildingsByCategory } from '@/services/database/buildingRepository';
import { getCategoryById } from '@/services/database/repositories';
import { relayoutCategoryMonuments } from '@/features/progression/monumentLayoutService';
import { reconcileWallBrickAbsorption } from '@/features/bricks/brickService';
import { withDbWrite } from '@/services/database/dbQueue';

interface MapSceneState {
  scenes: Record<string, { bricks: Brick[]; buildings: BuildingInstance[] }>;
  loadingIds: Record<string, boolean>;
  loadCategory: (categoryId: string) => Promise<void>;
  /** Instant empty scene after create — no SQLite work on the hot path. */
  seedEmptyScene: (categoryId: string) => void;
  loadAll: (categoryIds: string[]) => Promise<void>;
  applyUpdate: (categoryId: string, update: SceneBrickUpdate) => void;
  applyBatchUpdate: (categoryId: string, bricks: Brick[], buildings?: BuildingInstance[]) => void;
  /** Reload bricks from DB after placement (applies wall absorption). */
  syncBricksAfterPlacement: (
    categoryId: string,
    newBuildings?: BuildingInstance[],
  ) => Promise<void>;
  /** Debounced DB sync — safe to call after every rapid brick placement. */
  scheduleSyncAfterPlacement: (
    categoryId: string,
    newBuildings?: BuildingInstance[],
  ) => void;
  refreshCategory: (categoryId: string) => Promise<void>;
  removeCategory: (categoryId: string) => void;
  clearAll: () => void;
}

const refreshInFlight = new Map<string, Promise<void>>();
const loadInFlight = new Map<string, Promise<void>>();
const syncTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useMapSceneStore = create<MapSceneState>((set, get) => ({
  scenes: {},
  loadingIds: {},

  seedEmptyScene(categoryId) {
    if (get().scenes[categoryId]) return;
    set((state) => ({
      scenes: { ...state.scenes, [categoryId]: { bricks: [], buildings: [] } },
    }));
  },

  async loadCategory(categoryId) {
    if (get().scenes[categoryId]) return;

    const existing = loadInFlight.get(categoryId);
    if (existing) return existing;

    const job = (async () => {
      set((state) => ({
        loadingIds: { ...state.loadingIds, [categoryId]: true },
      }));

      try {
        const category = await getCategoryById(categoryId);
        if (!category) return;

        if (category.totalBrickValue > 0) {
          await withDbWrite(() => reconcileWallBrickAbsorption(categoryId));
        }
        const bricks = await getBricksByCategory(categoryId);
        const buildings = await relayoutCategoryMonuments(categoryId, category.type);
        set((state) => ({
          scenes: { ...state.scenes, [categoryId]: { bricks, buildings } },
          loadingIds: { ...state.loadingIds, [categoryId]: false },
        }));
      } catch (error) {
        console.error('loadCategory failed:', categoryId, error);
        set((state) => ({
          loadingIds: { ...state.loadingIds, [categoryId]: false },
        }));
      }
    })();

    loadInFlight.set(categoryId, job);
    try {
      await job;
    } finally {
      loadInFlight.delete(categoryId);
    }
  },

  async loadAll(categoryIds) {
    // Only load scenes that are missing — avoids hammering SQLite after create on Android.
    await Promise.all(categoryIds.map((id) => get().loadCategory(id)));
  },

  applyUpdate(categoryId, update) {
    set((state) => {
      const current = state.scenes[categoryId] ?? { bricks: [], buildings: [] };
      const incoming = update.bricks ?? (update.brick ? [update.brick] : []);
      const bricks = [...current.bricks];
      for (const brick of incoming) {
        if (!bricks.some((b) => b.id === brick.id)) bricks.push(brick);
      }
      const buildings =
        update.buildings && update.buildings.length > 0
          ? [
              ...current.buildings,
              ...update.buildings.filter(
                (b) => !current.buildings.some((existing) => existing.id === b.id),
              ),
            ]
          : current.buildings;
      return { scenes: { ...state.scenes, [categoryId]: { bricks, buildings } } };
    });
  },

  applyBatchUpdate(categoryId, incomingBricks, newBuildings) {
    set((state) => {
      const current = state.scenes[categoryId] ?? { bricks: [], buildings: [] };
      const bricks = [...current.bricks];
      for (const brick of incomingBricks) {
        if (!bricks.some((b) => b.id === brick.id)) bricks.push(brick);
      }
      const buildings =
        newBuildings && newBuildings.length > 0
          ? [
              ...current.buildings,
              ...newBuildings.filter(
                (b) => !current.buildings.some((existing) => existing.id === b.id),
              ),
            ]
          : current.buildings;
      return { scenes: { ...state.scenes, [categoryId]: { bricks, buildings } } };
    });
  },

  async syncBricksAfterPlacement(categoryId, newBuildings) {
    const bricks = await getBricksByCategory(categoryId);
    let buildings = get().scenes[categoryId]?.buildings ?? [];

    if (newBuildings && newBuildings.length > 0) {
      buildings = [
        ...buildings,
        ...newBuildings.filter((b) => !buildings.some((existing) => existing.id === b.id)),
      ];
      const category = await getCategoryById(categoryId);
      if (category) {
        buildings = await relayoutCategoryMonuments(categoryId, category.type);
      }
    }

    set((state) => ({
      scenes: { ...state.scenes, [categoryId]: { bricks, buildings } },
    }));
  },

  scheduleSyncAfterPlacement(categoryId, newBuildings) {
    const existing = syncTimers.get(categoryId);
    if (existing) clearTimeout(existing);
    syncTimers.set(
      categoryId,
      setTimeout(() => {
        syncTimers.delete(categoryId);
        void get().syncBricksAfterPlacement(categoryId, newBuildings);
      }, 2000),
    );
  },

  async refreshCategory(categoryId) {
    const existing = refreshInFlight.get(categoryId);
    if (existing) return existing;

    const job = (async () => {
      try {
        const bricks = await getBricksByCategory(categoryId);
        const category = await getCategoryById(categoryId);
        const buildings = category
          ? await relayoutCategoryMonuments(categoryId, category.type)
          : await getBuildingsByCategory(categoryId);
        set((state) => ({
          scenes: { ...state.scenes, [categoryId]: { bricks, buildings } },
        }));
      } finally {
        refreshInFlight.delete(categoryId);
      }
    })();

    refreshInFlight.set(categoryId, job);
    return job;
  },

  removeCategory(categoryId) {
    refreshInFlight.delete(categoryId);
    loadInFlight.delete(categoryId);
    const timer = syncTimers.get(categoryId);
    if (timer) clearTimeout(timer);
    syncTimers.delete(categoryId);
    set((state) => {
      const { [categoryId]: _, ...scenes } = state.scenes;
      const { [categoryId]: __, ...loadingIds } = state.loadingIds;
      return { scenes, loadingIds };
    });
  },

  clearAll() {
    refreshInFlight.clear();
    loadInFlight.clear();
    for (const timer of syncTimers.values()) clearTimeout(timer);
    syncTimers.clear();
    set({ scenes: {}, loadingIds: {} });
  },
}));
