import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useTimerStore } from '@/store/timerStore';
import { useSettingsStore } from '@/store/settingsStore';

/** Strict/soft focus rules when app leaves foreground. */
export function useFocusSessionAppState(onAbandon?: () => void) {
  const { session, pause, abandon } = useTimerStore();
  const { settings } = useSettingsStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (!session || session.status !== 'active') return;

      if (appState.current === 'active' && next.match(/inactive|background/)) {
        if (settings.focusMode === 'strict') {
          void abandon().then(() => onAbandon?.());
          return;
        }
        if (settings.focusMode === 'soft' && session.pauseCount >= 1) {
          void abandon().then(() => onAbandon?.());
          return;
        }
        pause();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [session, settings.focusMode, pause, abandon, onAbandon]);
}
