import * as Haptics from 'expo-haptics';
import { create } from 'zustand';
import type { ConfettiVariant } from '@/components/celebration/confettiParticles';
import { useSettingsStore } from './settingsStore';

interface BrickConfettiState {
  burstId: number;
  variant: ConfettiVariant;
  triggerBrickConfetti: (variant?: ConfettiVariant) => void;
}

export const useBrickConfettiStore = create<BrickConfettiState>((set) => ({
  burstId: 0,
  variant: 'brick',
  triggerBrickConfetti: (variant = 'brick') => {
    const { hapticsEnabled } = useSettingsStore.getState().settings;
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    set((state) => ({ burstId: state.burstId + 1, variant }));
  },
}));
