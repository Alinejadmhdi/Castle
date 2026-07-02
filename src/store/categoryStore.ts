import { create } from 'zustand';
import type { Category } from '@/types';
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
} from '@/services/database/repositories';
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
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  load: async () => {
    const showSpinner = get().categories.length === 0;
    if (showSpinner) set({ loading: true });
    const categories = await getAllCategories();
    set({ categories, loading: false });
  },
  add: async (input) => {
    const category = await createCategory(input);
    set({ categories: [...get().categories, category] });
    return category;
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
}));
