/** Serialize SQLite access on Android; reentrant so nested calls don't deadlock. */
let tail: Promise<unknown> = Promise.resolve();
let inDbQueue = false;

export function withDb<T>(fn: () => Promise<T>): Promise<T> {
  if (inDbQueue) {
    return fn();
  }

  const run = tail.then(async () => {
    inDbQueue = true;
    try {
      return await fn();
    } finally {
      inDbQueue = false;
    }
  });

  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** @deprecated alias */
export const withDbWrite = withDb;
