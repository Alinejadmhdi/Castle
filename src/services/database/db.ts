import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, DEFAULT_SETTINGS, SCHEMA_VERSION } from './schema';
import { withDb } from './dbQueue';

type NativeDb = SQLite.SQLiteDatabase;

let nativeDb: NativeDb | null = null;
let openPromise: Promise<NativeDb> | null = null;
let wrappedDb: NativeDb | null = null;

/** Android rejects undefined bind params with NPE — coerce to null. */
function sanitizeParams(params?: unknown[]): unknown[] | undefined {
  if (!params) return undefined;
  return params.map((p) => (p === undefined ? null : p));
}

async function openNativeDatabase(): Promise<NativeDb> {
  if (nativeDb) return nativeDb;

  if (!openPromise) {
    openPromise = withDb(async () => {
      const db = await SQLite.openDatabaseAsync('lifescastle.db');
      await db.execAsync(CREATE_TABLES_SQL);
      await db.execAsync(DEFAULT_SETTINGS);
      await db.runAsync(`CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY)`);
      const row = await db.getFirstAsync<{ version: number }>(
        'SELECT version FROM schema_version LIMIT 1',
      );
      if (!row) {
        await db.runAsync('INSERT INTO schema_version (version) VALUES (?)', [SCHEMA_VERSION]);
      } else if (row.version < SCHEMA_VERSION) {
        const cols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(sessions)');
        if (!cols.some((c) => c.name === 'timer_mode')) {
          await db.execAsync(`ALTER TABLE sessions ADD COLUMN timer_mode TEXT DEFAULT 'countdown'`);
        }
        await db.runAsync('UPDATE schema_version SET version = ?', [SCHEMA_VERSION]);
      }
      nativeDb = db;
      return db;
    }).catch((err) => {
      openPromise = null;
      nativeDb = null;
      throw err;
    });
  }

  return openPromise;
}

function wrapDatabase(db: NativeDb): NativeDb {
  return {
    ...db,
    runAsync: (sql: string, params?: unknown[]) =>
      withDb(() =>
        params
          ? db.runAsync(sql, sanitizeParams(params) as SQLite.SQLiteBindParams)
          : db.runAsync(sql),
      ),
    getFirstAsync: <T,>(sql: string, params?: unknown[]) =>
      withDb(() =>
        params
          ? db.getFirstAsync<T>(sql, sanitizeParams(params) as SQLite.SQLiteBindParams)
          : db.getFirstAsync<T>(sql),
      ),
    getAllAsync: <T,>(sql: string, params?: unknown[]) =>
      withDb(() =>
        params
          ? db.getAllAsync<T>(sql, sanitizeParams(params) as SQLite.SQLiteBindParams)
          : db.getAllAsync<T>(sql),
      ),
    execAsync: (sql: string) => withDb(() => db.execAsync(sql)),
    closeAsync: () =>
      withDb(async () => {
        await db.closeAsync();
        nativeDb = null;
        openPromise = null;
        wrappedDb = null;
      }),
  } as NativeDb;
}

export async function getDatabase(): Promise<NativeDb> {
  if (wrappedDb) return wrappedDb;
  const db = await openNativeDatabase();
  wrappedDb = wrapDatabase(db);
  return wrappedDb;
}

export async function resetDatabase(): Promise<void> {
  await withDb(async () => {
    if (nativeDb) {
      await nativeDb.closeAsync();
    }
    nativeDb = null;
    openPromise = null;
    wrappedDb = null;
  });
  await SQLite.deleteDatabaseAsync('lifescastle.db');
  await getDatabase();
}
