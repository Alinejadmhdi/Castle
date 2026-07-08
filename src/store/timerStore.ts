import { create } from 'zustand';
import type { Brick, FocusSession, SessionTimerMode, UnlockEvent } from '@/types';
import { generateId, msToBrickValue } from '@/utils';
import { sessionElapsedMs } from '@/utils/sessionTiming';
import {
  getActiveSession,
  insertSession,
  updateSession,
} from '@/services/database/brickRepository';
import { completeSessionBricks } from '@/features/bricks/brickService';
import { useSettingsStore } from './settingsStore';
import { useCategoryStore } from './categoryStore';
import { useCelebrationStore } from './celebrationStore';
import { usePlotRenderStore } from './plotRenderStore';

interface TimerState {
  session: FocusSession | null;
  remainingMs: number;
  tickInterval: ReturnType<typeof setInterval> | null;
  /** Wall-clock anchor for the current active segment (not persisted). */
  activeSinceMs: number | null;
  lastResult: { bricks: Brick[]; unlocks: UnlockEvent[] } | null;
  loadActive: () => Promise<void>;
  ensureTicking: () => void;
  start: (input: {
    categoryId: string;
    brickColor: string;
    plannedDurationMs: number;
    timerMode?: SessionTimerMode;
  }) => Promise<void>;
  pause: () => void;
  resume: () => void;
  syncFromClock: () => Promise<void>;
  complete: () => Promise<boolean>;
  abandon: () => Promise<void>;
  clearResult: () => void;
}

function calcRemaining(session: FocusSession): number {
  if (session.timerMode === 'stopwatch') {
    return session.elapsedMs;
  }
  return Math.max(0, session.plannedDurationMs - session.elapsedMs);
}

function isStopwatch(session: FocusSession): boolean {
  return session.timerMode === 'stopwatch';
}

function segmentElapsedMs(session: FocusSession, activeSinceMs: number | null): number {
  if (session.status !== 'active' || activeSinceMs == null) return session.elapsedMs;
  return session.elapsedMs + (Date.now() - activeSinceMs);
}

function clearTickInterval(interval: ReturnType<typeof setInterval> | null) {
  if (interval) clearInterval(interval);
}

let completingSession = false;

function cappedElapsedMs(session: FocusSession, activeSinceMs: number | null): number {
  if (session.status !== 'active' || activeSinceMs == null) {
    return sessionElapsedMs(session);
  }
  const elapsedMs = session.elapsedMs + (Date.now() - activeSinceMs);
  if (session.timerMode === 'stopwatch' || session.plannedDurationMs <= 0) {
    return elapsedMs;
  }
  return Math.min(elapsedMs, session.plannedDurationMs);
}

export const useTimerStore = create<TimerState>((set, get) => {
  function startTicking() {
    clearTickInterval(get().tickInterval);
    const interval = setInterval(() => {
      void get().syncFromClock();
    }, 1000);
    set({ tickInterval: interval });
  }

  return {
    session: null,
    remainingMs: 0,
    tickInterval: null,
    activeSinceMs: null,
    lastResult: null,

    loadActive: async () => {
      const session = await getActiveSession();
      if (!session) return;

      // Pause orphaned sessions on cold start — user resumes explicitly via Focus.
      if (session.status === 'active') {
        const updated: FocusSession = { ...session, status: 'paused' };
        await updateSession(updated);
        set({
          session: updated,
          remainingMs: calcRemaining(updated),
          activeSinceMs: null,
          lastResult: null,
        });
        return;
      }

      set({
        session,
        remainingMs: calcRemaining(session),
        activeSinceMs: null,
        lastResult: null,
      });
    },

    ensureTicking: () => {
      const { session, tickInterval } = get();
      if (session?.status === 'active' && tickInterval == null) {
        startTicking();
      }
    },

    start: async ({ categoryId, brickColor, plannedDurationMs, timerMode = 'countdown' }) => {
      let existing = get().session;
      if (existing?.status === 'paused') {
        await get().abandon();
        existing = null;
      }
      if (existing?.status === 'active') {
        throw new Error('Session already active');
      }

      clearTickInterval(get().tickInterval);

      const session: FocusSession = {
        id: generateId(),
        categoryId,
        brickColor,
        plannedDurationMs: timerMode === 'stopwatch' ? 0 : plannedDurationMs,
        elapsedMs: 0,
        startedAt: new Date().toISOString(),
        endedAt: null,
        status: 'active',
        pauseCount: 0,
        bricksEarned: 0,
        timerMode,
      };
      await insertSession(session);
      usePlotRenderStore.getState().activate3d(categoryId);
      startTicking();
      set({
        session,
        remainingMs: timerMode === 'stopwatch' ? 0 : plannedDurationMs,
        activeSinceMs: Date.now(),
        lastResult: null,
      });
    },

    pause: () => {
      const { session, tickInterval, activeSinceMs } = get();
      if (!session || session.status !== 'active') return;
      clearTickInterval(tickInterval);

      const elapsedMs = segmentElapsedMs(session, activeSinceMs);
      const updated: FocusSession = {
        ...session,
        elapsedMs,
        status: 'paused',
        pauseCount: session.pauseCount + 1,
      };
      void updateSession(updated);
      set({
        session: updated,
        tickInterval: null,
        activeSinceMs: null,
        remainingMs: calcRemaining(updated),
      });
    },

    resume: () => {
      const { session } = get();
      if (!session || session.status !== 'paused') return;
      const updated: FocusSession = { ...session, status: 'active' };
      void updateSession(updated);
      startTicking();
      set({ session: updated, activeSinceMs: Date.now() });
    },

    syncFromClock: async () => {
      const { session } = get();
      if (!session) return;

      if (session.status !== 'active') {
        set({ remainingMs: calcRemaining(session) });
        return;
      }

      const now = Date.now();
      const { activeSinceMs } = get();
      const totalElapsed = segmentElapsedMs(session, activeSinceMs);

      if (isStopwatch(session)) {
        const updated = { ...session, elapsedMs: totalElapsed };
        void updateSession(updated);
        set({
          session: updated,
          remainingMs: totalElapsed,
          activeSinceMs: now,
        });
        return;
      }

      const cappedElapsed = Math.min(session.plannedDurationMs, totalElapsed);

      if (cappedElapsed >= session.plannedDurationMs) {
        clearTickInterval(get().tickInterval);
        set({
          session: { ...session, elapsedMs: cappedElapsed },
          remainingMs: 0,
          activeSinceMs: null,
          tickInterval: null,
        });
        await get().complete();
        return;
      }

      const updated = { ...session, elapsedMs: cappedElapsed };
      void updateSession(updated);
      set({
        session: updated,
        remainingMs: session.plannedDurationMs - cappedElapsed,
        activeSinceMs: now,
      });
    },

    complete: async () => {
      if (completingSession) return false;
      const { session, tickInterval, activeSinceMs } = get();
      if (!session || session.status === 'completed' || session.status === 'abandoned') {
        return false;
      }

      completingSession = true;
      clearTickInterval(tickInterval);

      const elapsedMs = cappedElapsedMs(session, activeSinceMs);
      const settings = useSettingsStore.getState().settings;
      const brickValue = msToBrickValue(elapsedMs, settings.fractionalBricksEnabled);

      const updated: FocusSession = {
        ...session,
        elapsedMs,
        endedAt: new Date().toISOString(),
        status: 'completed',
        bricksEarned: brickValue,
      };

      set({
        session: updated,
        activeSinceMs: null,
        tickInterval: null,
        remainingMs: 0,
      });

      try {
        await updateSession(updated);

        const result = await completeSessionBricks(
          updated,
          elapsedMs,
          settings.fractionalBricksEnabled,
        );

        if (result) {
          await useCategoryStore.getState().refreshOne(session.categoryId);
          if (result.unlocks.length > 0) {
            useCelebrationStore.getState().trigger(result.unlocks);
          }
          set({
            session: null,
            remainingMs: 0,
            tickInterval: null,
            activeSinceMs: null,
            lastResult: { bricks: result.bricks, unlocks: result.unlocks },
          });
          return true;
        }

        set({
          session: null,
          remainingMs: 0,
          tickInterval: null,
          activeSinceMs: null,
          lastResult: null,
        });
        return false;
      } catch (error) {
        console.error('complete session failed:', error);
        return false;
      } finally {
        completingSession = false;
      }
    },

    abandon: async () => {
      const { session, tickInterval } = get();
      if (!session) return;
      clearTickInterval(tickInterval);

      const updated: FocusSession = {
        ...session,
        endedAt: new Date().toISOString(),
        status: 'abandoned',
      };
      await updateSession(updated);
      set({
        session: null,
        remainingMs: 0,
        tickInterval: null,
        activeSinceMs: null,
        lastResult: null,
      });
    },

    clearResult: () => set({ lastResult: null }),
  };
});
