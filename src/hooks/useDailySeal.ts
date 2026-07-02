import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { sealStaleDailyBuilds } from '@/features/daily/dailySealService';
import { useCelebrationStore } from '@/store/celebrationStore';
import { todayLocalDate } from '@/utils';

/** Seals open daily builds when the calendar day changes or app returns to foreground. */
export function useDailySeal() {
  const lastDateRef = useRef(todayLocalDate());
  const sealingRef = useRef(false);

  useEffect(() => {
    async function runSeal() {
      if (sealingRef.current) return;
      sealingRef.current = true;
      try {
        const unlocks = await sealStaleDailyBuilds();
        if (unlocks.length > 0) {
          useCelebrationStore.getState().trigger(unlocks);
        }
      } finally {
        sealingRef.current = false;
      }
    }

    function onStateChange(state: AppStateStatus) {
      const today = todayLocalDate();
      if (today !== lastDateRef.current) {
        lastDateRef.current = today;
        void runSeal();
        return;
      }
      if (state === 'active') {
        void runSeal();
      }
    }

    void runSeal();
    const sub = AppState.addEventListener('change', onStateChange);
    return () => sub.remove();
  }, []);
}
