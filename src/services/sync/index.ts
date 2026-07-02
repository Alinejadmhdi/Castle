import type { SyncAdapter } from './SyncAdapter';

/** No-op sync for v1 local-only. Replace when CLOUD_SYNC flag enabled. */
export const localSyncAdapter: SyncAdapter = {
  async push(): Promise<void> {},
  async pull(): Promise<void> {},
  async exportBackup(): Promise<string> {
    return JSON.stringify({ version: 1, exportedAt: new Date().toISOString() });
  },
  async importBackup(): Promise<void> {},
};
