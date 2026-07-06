import { InteractionManager, Platform } from 'react-native';
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

let pendingUnlocks: UnlockEvent[] = [];
let showTimer: ReturnType<typeof setTimeout> | null = null;

/** Wait for rapid resist taps to finish before showing the overlay. */
const IDLE_BEFORE_SHOW_MS = 900;
/** Extra buffer after interactions settle. */
const AFTER_INTERACTIONS_MS = 500;

/** Android crashes with nested NavigationContainer when the unlock overlay mounts during rapid taps. */
const SHOW_UNLOCK_OVERLAY = Platform.OS !== 'android';

function playUnlockFeedback() {
  const { hapticsEnabled, sfxEnabled } = useSettingsStore.getState().settings;
  if (hapticsEnabled) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
  if (sfxEnabled) {
    void playUnlockSound();
  }
}

function flushCelebration(set: (partial: Partial<CelebrationState>) => void) {
  const batch = pendingUnlocks;
  pendingUnlocks = [];
  if (batch.length === 0) return;

  if (!SHOW_UNLOCK_OVERLAY) {
    return;
  }

  InteractionManager.runAfterInteractions(() => {
    setTimeout(() => {
      set({ active: true, unlocks: batch });
    }, AFTER_INTERACTIONS_MS);
  });
}

export const useCelebrationStore = create<CelebrationState>((set) => ({
  active: false,
  unlocks: [],
  trigger: (unlocks) => {
    if (unlocks.length === 0) return;

    playUnlockFeedback();
    pendingUnlocks.push(...unlocks);

    if (!SHOW_UNLOCK_OVERLAY) {
      return;
    }

    if (showTimer) clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      showTimer = null;
      flushCelebration(set);
    }, IDLE_BEFORE_SHOW_MS);
  },
  dismiss: () => {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }
    pendingUnlocks = [];
    set({ active: false, unlocks: [] });
  },
}));
