/** Serialize async work per category (prevents lost brick totals when tapping rapidly). */
const tails = new Map<string, Promise<unknown>>();

export function withCategoryLock<T>(categoryId: string, fn: () => Promise<T>): Promise<T> {
  const prev = tails.get(categoryId) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(fn);
  tails.set(
    categoryId,
    next.then(
      () => undefined,
      () => undefined,
    ),
  );
  return next;
}
