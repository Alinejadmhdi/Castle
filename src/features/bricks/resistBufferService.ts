import type { BrickCreationResult } from './brickService';
import { flushMiniatureResistBatch } from './brickService';

const FLUSH_DELAY_MS = 750;
const IMMEDIATE_FLUSH_AT = 15;

type FlushHandler = (result: BrickCreationResult) => void;
type ErrorHandler = (error: unknown) => void;

interface CategoryBuffer {
  pending: number;
  timer: ReturnType<typeof setTimeout> | null;
  flushing: Promise<void> | null;
}

const buffers = new Map<string, CategoryBuffer>();
const flushListeners = new Map<string, Set<FlushHandler>>();
const errorListeners = new Map<string, Set<ErrorHandler>>();

function getBuffer(categoryId: string): CategoryBuffer {
  let buf = buffers.get(categoryId);
  if (!buf) {
    buf = { pending: 0, timer: null, flushing: null };
    buffers.set(categoryId, buf);
  }
  return buf;
}

export function subscribeMiniatureResistFlush(
  categoryId: string,
  handler: FlushHandler,
): () => void {
  if (!flushListeners.has(categoryId)) flushListeners.set(categoryId, new Set());
  flushListeners.get(categoryId)!.add(handler);
  return () => flushListeners.get(categoryId)?.delete(handler);
}

export function subscribeMiniatureResistError(
  categoryId: string,
  handler: ErrorHandler,
): () => void {
  if (!errorListeners.has(categoryId)) errorListeners.set(categoryId, new Set());
  errorListeners.get(categoryId)!.add(handler);
  return () => errorListeners.get(categoryId)?.delete(handler);
}

async function runFlush(categoryId: string): Promise<void> {
  const buf = getBuffer(categoryId);
  if (buf.pending <= 0) return;

  const count = buf.pending;
  buf.pending = 0;
  if (buf.timer) {
    clearTimeout(buf.timer);
    buf.timer = null;
  }

  try {
    const result = await flushMiniatureResistBatch(categoryId, count);
    flushListeners.get(categoryId)?.forEach((handler) => handler(result));
  } catch (error) {
    errorListeners.get(categoryId)?.forEach((handler) => handler(error));
    throw error;
  }
}

function scheduleFlush(categoryId: string): void {
  const buf = getBuffer(categoryId);
  if (buf.timer) clearTimeout(buf.timer);

  const startFlush = () => {
    buf.flushing = runFlush(categoryId)
      .catch(() => undefined)
      .finally(() => {
        buf.flushing = null;
        if (buf.pending > 0) scheduleFlush(categoryId);
      });
  };

  if (buf.pending >= IMMEDIATE_FLUSH_AT) {
    buf.timer = null;
    startFlush();
    return;
  }

  buf.timer = setTimeout(() => {
    buf.timer = null;
    startFlush();
  }, FLUSH_DELAY_MS);
}

/** Queue one resist — batched DB write after a short pause. */
export function enqueueMiniatureResist(categoryId: string): void {
  const buf = getBuffer(categoryId);
  buf.pending += 1;
  scheduleFlush(categoryId);
}

export async function flushMiniatureResistNow(categoryId: string): Promise<void> {
  const buf = getBuffer(categoryId);
  if (buf.flushing) await buf.flushing;
  if (buf.pending > 0) await runFlush(categoryId);
}

export function getPendingResistCount(categoryId: string): number {
  return getBuffer(categoryId).pending;
}
