import { create } from 'zustand';
import type { Brick, BuildingInstance } from '@/types';
import type { SceneBrickUpdate } from '@/components/map/MapActionPanel';
import { getBricksByCategory } from '@/services/database/brickRepository';
import { getBuildingsByCategory } from '@/services/database/buildingRepository';
import { getCategoryById } from '@/services/database/repositories';
import { relayoutCategoryMonuments } from '@/features/progression/monumentLayoutService';

interface MapSceneState {
  scenes: Record<string, { bricks: Brick[]; buildings: BuildingInstance[] }>;
  loadingIds: Record<string, boolean>;
  loadCategory: (categoryId: string) => Promise<void>;
  loadAll: (categoryIds: string[]) => Promise<void>;
  applyUpdate: (categoryId: string, update: SceneBrickUpdate) => void;
  refreshCategory: (categoryId: string) => Promise<void>;
  removeCategory: (categoryId: string) => void;
  clearAll: () => void;
}

export const useMapSceneStore = create<MapSceneState>((set, get) => ({
  scenes: {},
  loadingIds: {},

  async loadCategory(categoryId) {
    if (get().scenes[categoryId]) return;
    if (get().loadingIds[categoryId]) return;

    set((state) => ({
      loadingIds: { ...state.loadingIds, [categoryId]: true },
    }));

    try {
      const bricks = await getBricksByCategory(categoryId);
      const category = await getCategoryById(categoryId);
      const buildings = category
        ? await relayoutCategoryMonuments(categoryId, category.type)
        : await getBuildingsByCategory(categoryId);
      set((state) => ({
        scenes: { ...state.scenes, [categoryId]: { bricks, buildings } },
        loadingIds: { ...state.loadingIds, [categoryId]: false },
      }));
    } catch {
      set((state) => ({
        loadingIds: { ...state.loadingIds, [categoryId]: false },
      }));
    }
  },

  async loadAll(categoryIds) {
    await Promise.all(categoryIds.map((id) => get().loadCategory(id)));
  },

  applyUpdate(categoryId, update) {
    set((state) => {
      const current = state.scenes[categoryId] ?? { bricks: [], buildings: [] };
      const hasBrick = current.bricks.some((b) => b.id === update.brick.id);
      const bricks = hasBrick ? current.bricks : [...current.bricks, update.brick];
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

  async refreshCategory(categoryId) {
    const bricks = await getBricksByCategory(categoryId);
    const category = await getCategoryById(categoryId);
    const buildings = category
      ? await relayoutCategoryMonuments(categoryId, category.type)
      : await getBuildingsByCategory(categoryId);
    set((state) => ({
      scenes: { ...state.scenes, [categoryId]: { bricks, buildings } },
    }));
  },

  removeCategory(categoryId) {
    set((state) => {
      const { [categoryId]: _, ...scenes } = state.scenes;
      const { [categoryId]: __, ...loadingIds } = state.loadingIds;
      return { scenes, loadingIds };
    });
  },

  clearAll() {
    set({ scenes: {}, loadingIds: {} });
  },
}));
