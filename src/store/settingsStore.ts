import { create } from 'zustand';
import type { UserSettings } from '@/types';
import { getSettings, saveSettings } from '@/services/database/repositories';

interface SettingsState {
  settings: UserSettings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (partial: Partial<UserSettings>) => Promise<void>;
}

const defaultSettings: UserSettings = {
  focusMode: 'soft',
  fractionalBricksEnabled: true,
  ambientSound: 'none',
  sfxEnabled: true,
  hapticsEnabled: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  loaded: false,
  load: async () => {
    const settings = await getSettings();
    set({ settings, loaded: true });
  },
  update: async (partial) => {
    const next = { ...get().settings, ...partial };
    await saveSettings(next);
    set({ settings: next });
  },
}));
