export interface SyncAdapter {
  push(): Promise<void>;
  pull(): Promise<void>;
  exportBackup(): Promise<string>;
  importBackup(data: string): Promise<void>;
}
