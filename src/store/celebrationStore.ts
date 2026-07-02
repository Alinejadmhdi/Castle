import { create } from 'zustand';
import type { UnlockEvent } from '@/types';
import * as Haptics from 'expo-haptics';
import { playUnlockSound } from '@/services/audio/audioService';
import { useSettingsStore } from './settingsStore';

interface CelebrationState {
  active: boolean;
  unlocks: UnlockEvent[];
  trigger: (unlocks: UnlockEvent[]) => void;
  dismiss: () => void;
}

export const useCelebrationStore = create<CelebrationState>((set) => ({
  active: false,
  unlocks: [],
  trigger: (unlocks) => {
    const { hapticsEnabled, sfxEnabled } = useSettingsStore.getState().settings;
    if (hapticsEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (sfxEnabled && unlocks.length > 0) {
      void playUnlockSound();
    }
    set({ active: true, unlocks });
  },
  dismiss: () => set({ active: false, unlocks: [] }),
}));
