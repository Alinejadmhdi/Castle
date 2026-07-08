import * as Haptics from 'expo-haptics';
import { create } from 'zustand';
import { useSettingsStore } from './settingsStore';

interface BrickConfettiState {
  burstId: number;
  triggerBrickConfetti: () => void;
}

export const useBrickConfettiStore = create<BrickConfettiState>((set) => ({
  burstId: 0,
  triggerBrickConfetti: () => {
    const { hapticsEnabled } = useSettingsStore.getState().settings;
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    set((state) => ({ burstId: state.burstId + 1 }));
  },
}));
