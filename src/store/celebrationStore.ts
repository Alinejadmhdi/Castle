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

let celebrationTimer: ReturnType<typeof setTimeout> | null = null;

export const useCelebrationStore = create<CelebrationState>((set) => ({
  active: false,
  unlocks: [],
  trigger: (unlocks) => {
    if (unlocks.length === 0) return;

    const { hapticsEnabled, sfxEnabled } = useSettingsStore.getState().settings;
    if (hapticsEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (sfxEnabled) {
      void playUnlockSound();
    }

    if (celebrationTimer) clearTimeout(celebrationTimer);
    celebrationTimer = setTimeout(() => {
      celebrationTimer = null;
      set({ active: true, unlocks });
    }, 450);
  },
  dismiss: () => {
    if (celebrationTimer) {
      clearTimeout(celebrationTimer);
      celebrationTimer = null;
    }
    set({ active: false, unlocks: [] });
  },
}));
