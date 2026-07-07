import { InteractionManager, Platform } from 'react-native';
import { router } from 'expo-router';
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
let overlayAllowed = Platform.OS !== 'android';

/** Call once tabs are mounted — avoids racing navigation during cold start. */
export function allowCelebrationOverlay(): void {
  overlayAllowed = true;
  if (pendingUnlocks.length > 0 && !showTimer) {
    showTimer = setTimeout(() => {
      showTimer = null;
      flushCelebration((partial) => useCelebrationStore.setState(partial));
    }, idleBeforeShowMs());
  }
}

function idleBeforeShowMs(): number {
  return Platform.OS === 'android' ? 1800 : 900;
}

const AFTER_INTERACTIONS_MS = Platform.OS === 'android' ? 800 : 500;

function playUnlockFeedback() {
  const { hapticsEnabled, sfxEnabled } = useSettingsStore.getState().settings;
  if (hapticsEnabled) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
  if (sfxEnabled) {
    void playUnlockSound();
  }
}

function showCelebration(
  set: (partial: Partial<CelebrationState>) => void,
  batch: UnlockEvent[],
): void {
  set({ active: true, unlocks: batch });
  if (Platform.OS === 'android') {
    router.push('/unlock-celebration' as never);
  }
}

function flushCelebration(set: (partial: Partial<CelebrationState>) => void) {
  if (!overlayAllowed) {
    showTimer = setTimeout(() => {
      showTimer = null;
      flushCelebration(set);
    }, 400);
    return;
  }

  const batch = pendingUnlocks;
  pendingUnlocks = [];
  if (batch.length === 0) return;

  InteractionManager.runAfterInteractions(() => {
    setTimeout(() => {
      showCelebration(set, batch);
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

    if (showTimer) clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      showTimer = null;
      flushCelebration(set);
    }, idleBeforeShowMs());
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
