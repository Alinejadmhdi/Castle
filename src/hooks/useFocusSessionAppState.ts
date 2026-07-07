import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useTimerStore } from '@/store/timerStore';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Strict mode abandons when the app leaves the foreground.
 * Soft and free keep counting via wall-clock time (sync on return).
 */
export function useFocusSessionAppState(onAbandon?: () => void) {
  const { session, abandon, syncFromClock } = useTimerStore();
  const { settings } = useSettingsStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;

      if (next === 'active' && prev.match(/inactive|background/)) {
        void syncFromClock();
        return;
      }

      if (prev === 'active' && next.match(/inactive|background/)) {
        if (!session || session.status !== 'active') return;
        if (settings.focusMode === 'strict') {
          void abandon().then(() => onAbandon?.());
        }
      }
    });
    return () => sub.remove();
  }, [session, settings.focusMode, abandon, syncFromClock, onAbandon]);
}
