import { create } from 'zustand';

/** Categories that used Focus or Resist this app session — keep 3D until process ends. */
interface PlotRenderState {
  activated3dIds: Set<string>;
  activate3d: (categoryId: string) => void;
  isActivated3d: (categoryId: string) => boolean;
}

export const usePlotRenderStore = create<PlotRenderState>((set, get) => ({
  activated3dIds: new Set(),

  activate3d: (categoryId) => {
    const next = new Set(get().activated3dIds);
    next.add(categoryId);
    set({ activated3dIds: next });
  },

  isActivated3d: (categoryId) => get().activated3dIds.has(categoryId),
}));
