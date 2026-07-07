import { create } from 'zustand';

/** Categories that used Focus or Resist this app session. */
interface PlotRenderState {
  activated3dIds: Set<string>;
  /** Most recently focused/resisted — gets the single Life Map GL slot when no panel is open. */
  lastActivated3dId: string | null;
  activate3d: (categoryId: string) => void;
  isActivated3d: (categoryId: string) => boolean;
}

export const usePlotRenderStore = create<PlotRenderState>((set, get) => ({
  activated3dIds: new Set(),
  lastActivated3dId: null,

  activate3d: (categoryId) => {
    const next = new Set(get().activated3dIds);
    next.add(categoryId);
    set({ activated3dIds: next, lastActivated3dId: categoryId });
  },

  isActivated3d: (categoryId) => get().activated3dIds.has(categoryId),
}));

/** Only one GL canvas on Life Map — panel category wins, else last activated this session. */
export function resolveLifeMap3dCategoryId(
  panelCategoryId: string | null,
  lastActivated3dId: string | null,
): string | null {
  return panelCategoryId ?? lastActivated3dId;
}
