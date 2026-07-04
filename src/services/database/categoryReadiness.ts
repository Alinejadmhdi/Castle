import type { Category } from '@/types';
import { getCategoryById } from './repositories';

const RETRYABLE = /locked|SQLITE_BUSY|SQLITE_LOCKED/i;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Android sometimes cannot read a row immediately after insert — retry before giving up. */
export async function waitForCategory(
  id: string,
  maxAttempts = 12,
): Promise<Category> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const category = await getCategoryById(id);
    if (category) return category;
    await delay(40 * (attempt + 1));
  }
  throw new Error(`Category not found after ${maxAttempts} read attempts (id: ${id})`);
}

export async function withDbRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 6,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!RETRYABLE.test(message) || attempt === maxAttempts - 1) throw error;
      await delay(50 * (attempt + 1));
    }
  }
  throw lastError;
}
