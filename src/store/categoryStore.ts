import { create } from 'zustand';
import type { Category } from '@/types';
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
} from '@/services/database/repositories';
import { waitForCategory } from '@/services/database/categoryReadiness';
import { formatErrorForUser } from '@/utils/formatError';
import { useMapSceneStore } from './mapSceneStore';

interface CategoryState {
  categories: Category[];
  loading: boolean;
  load: () => Promise<void>;
  add: (input: {
    name: string;
    defaultColor: string;
    type: Category['type'];
  }) => Promise<Category>;
  remove: (id: string) => Promise<void>;
  refreshOne: (id: string) => Promise<void>;
  syncCategory: (category: Category) => void;
}

function mergeCategories(existing: Category[], fromDb: Category[]): Category[] {
  const byId = new Map(fromDb.map((c) => [c.id, c]));
  for (const cat of existing) {
    if (!byId.has(cat.id)) byId.set(cat.id, cat);
  }
  return [...byId.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  load: async () => {
    const showSpinner = get().categories.length === 0;
    if (showSpinner) set({ loading: true });
    const fromDb = await getAllCategories();
    set({
      categories: mergeCategories(get().categories, fromDb),
      loading: false,
    });
  },
  add: async (input) => {
    let created: Category;
    try {
      created = await createCategory(input);
      console.log('[CategoryStore.add] createCategory ok', created.id, created.type);
    } catch (error) {
      const detail = formatErrorForUser(error);
      console.error('[CategoryStore.add] createCategory failed', detail, error);
      throw new Error(`Step createCategory failed:\n${detail}`);
    }

    let verified: Category;
    try {
      verified = await waitForCategory(created.id);
      console.log('[CategoryStore.add] waitForCategory ok', verified.id);
    } catch (error) {
      const detail = formatErrorForUser(error);
      console.error('[CategoryStore.add] waitForCategory failed', created.id, detail, error);
      throw new Error(`Step waitForCategory failed (id ${created.id}):\n${detail}`);
    }

    set({ categories: mergeCategories(get().categories, [verified]) });
    useMapSceneStore.getState().seedEmptyScene(verified.id);
    return verified;
  },
  remove: async (id) => {
    await deleteCategory(id);
    useMapSceneStore.getState().removeCategory(id);
    set({ categories: get().categories.filter((c) => c.id !== id) });
  },
  refreshOne: async (id) => {
    const updated = await getCategoryById(id);
    if (!updated) return;
    set({
      categories: get().categories.map((c) => (c.id === id ? updated : c)),
    });
  },
  syncCategory: (category) => {
    set({
      categories: get().categories.map((c) => (c.id === category.id ? category : c)),
    });
  },
}));
