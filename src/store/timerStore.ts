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
  lastResult: { bricks: Brick[]; unlocks: UnlockEvent[] } | null;
  loadActive: () => Promise<void>;
  start: (input: {
    categoryId: string;
    brickColor: string;
    plannedDurationMs: number;
  }) => Promise<void>;
  pause: () => void;
  resume: () => void;
  tick: () => void;
  complete: () => Promise<boolean>;
  abandon: () => Promise<void>;
  clearResult: () => void;
}

function calcRemaining(session: FocusSession): number {
  return Math.max(0, session.plannedDurationMs - session.elapsedMs);
}

export const useTimerStore = create<TimerState>((set, get) => ({
  session: null,
  remainingMs: 0,
  tickInterval: null,
  lastResult: null,

  loadActive: async () => {
    const session = await getActiveSession();
    if (session) {
      set({ session, remainingMs: calcRemaining(session) });
    }
  },

  start: async ({ categoryId, brickColor, plannedDurationMs }) => {
    const existing = get().session;
    if (existing?.status === 'active' || existing?.status === 'paused') {
      throw new Error('Session already active');
    }

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

    const interval = setInterval(() => get().tick(), 1000);
    set({ session, remainingMs: plannedDurationMs, tickInterval: interval, lastResult: null });
  },

  pause: () => {
    const { session, tickInterval } = get();
    if (!session || session.status !== 'active') return;
    if (tickInterval) clearInterval(tickInterval);
    const updated = { ...session, status: 'paused' as const, pauseCount: session.pauseCount + 1 };
    void updateSession(updated);
    set({ session: updated, tickInterval: null });
  },

  resume: () => {
    const { session } = get();
    if (!session || session.status !== 'paused') return;
    const updated = { ...session, status: 'active' as const };
    void updateSession(updated);
    const interval = setInterval(() => get().tick(), 1000);
    set({ session: updated, tickInterval: interval });
  },

  tick: () => {
    const { session, tickInterval } = get();
    if (!session || session.status !== 'active') return;

    const elapsedMs = session.elapsedMs + 1000;
    const updated = { ...session, elapsedMs };
    void updateSession(updated);

    if (elapsedMs >= session.plannedDurationMs) {
      if (tickInterval) clearInterval(tickInterval);
      set({ session: updated, remainingMs: 0, tickInterval: null });
      void get().complete();
      return;
    }
    set({ session: updated, remainingMs: calcRemaining(updated) });
  },

  complete: async () => {
    const { session, tickInterval } = get();
    if (!session) return false;
    if (tickInterval) clearInterval(tickInterval);

    const elapsedMs = Math.min(session.elapsedMs, session.plannedDurationMs);
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
        lastResult: { bricks: result.bricks, unlocks: result.unlocks },
      });
      return true;
    }

    set({ session: null, remainingMs: 0, tickInterval: null, lastResult: null });
    return false;
  },

  abandon: async () => {
    const { session, tickInterval } = get();
    if (!session) return;
    if (tickInterval) clearInterval(tickInterval);

    const updated: FocusSession = {
      ...session,
      endedAt: new Date().toISOString(),
      status: 'abandoned',
    };
    await updateSession(updated);
    set({ session: null, remainingMs: 0, tickInterval: null, lastResult: null });
  },

  clearResult: () => set({ lastResult: null }),
}));
