import { create } from 'zustand';
import type { Brick, FocusSession, UnlockEvent } from '@/types';
import { generateId, msToBrickValue } from '@/utils';
import {
  getActiveSession,
  insertSession,
  updateSession,
} from '@/services/database/brickRepository';
import { completeSessionBricks } from '@/features/bricks/brickService';
import { useSettingsStore } from './settingsStore';
import { useCategoryStore } from './categoryStore';
import { useCelebrationStore } from './celebrationStore';

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
  }) => Promise<void>;
  pause: () => void;
  resume: () => void;
  syncFromClock: () => Promise<void>;
  complete: () => Promise<boolean>;
  abandon: () => Promise<void>;
  clearResult: () => void;
}

function calcRemaining(session: FocusSession): number {
  return Math.max(0, session.plannedDurationMs - session.elapsedMs);
}

function segmentElapsedMs(session: FocusSession, activeSinceMs: number | null): number {
  if (session.status !== 'active' || activeSinceMs == null) return session.elapsedMs;
  return session.elapsedMs + (Date.now() - activeSinceMs);
}

function clearTickInterval(interval: ReturnType<typeof setInterval> | null) {
  if (interval) clearInterval(interval);
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

    start: async ({ categoryId, brickColor, plannedDurationMs }) => {
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
        plannedDurationMs,
        elapsedMs: 0,
        startedAt: new Date().toISOString(),
        endedAt: null,
        status: 'active',
        pauseCount: 0,
        bricksEarned: 0,
      };
      await insertSession(session);
      startTicking();
      set({
        session,
        remainingMs: plannedDurationMs,
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
      const totalElapsed = Math.min(
        session.plannedDurationMs,
        segmentElapsedMs(session, activeSinceMs),
      );

      if (totalElapsed >= session.plannedDurationMs) {
        set({
          session: { ...session, elapsedMs: totalElapsed },
          remainingMs: 0,
          activeSinceMs: null,
        });
        await get().complete();
        return;
      }

      const updated = { ...session, elapsedMs: totalElapsed };
      void updateSession(updated);
      set({
        session: updated,
        remainingMs: session.plannedDurationMs - totalElapsed,
        activeSinceMs: now,
      });
    },

    complete: async () => {
      const { session, tickInterval, activeSinceMs } = get();
      if (!session) return false;
      clearTickInterval(tickInterval);

      const elapsedMs = Math.min(session.plannedDurationMs, segmentElapsedMs(session, activeSinceMs));
      const settings = useSettingsStore.getState().settings;
      const brickValue = msToBrickValue(elapsedMs, settings.fractionalBricksEnabled);

      const updated: FocusSession = {
        ...session,
        elapsedMs,
        endedAt: new Date().toISOString(),
        status: 'completed',
        bricksEarned: brickValue,
      };
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
