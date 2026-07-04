/** Turn any thrown value into text safe to show in an Alert or on-screen debug line. */
export function formatErrorForUser(error: unknown, fallback = 'Unknown error'): string {
  if (error instanceof Error) {
    const parts = [error.message];
    if (error.cause instanceof Error && error.cause.message !== error.message) {
      parts.push(`Cause: ${error.cause.message}`);
    }
    return parts.filter(Boolean).join('\n\n') || fallback;
  }
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}
