import { mkdirSync } from "node:fs";
import {createRequire} from "node:module";
import { dirname, join, resolve } from "node:path";

export type SqliteStatement = {
  run: (...params: unknown[]) => unknown;
  get: (...params: unknown[]) => unknown;
  all: (...params: unknown[]) => unknown[];
};

export type SqliteDatabase = {
  exec: (sql: string) => unknown;
  prepare: (sql: string) => SqliteStatement;
  pragma?: (source: string) => unknown;
};

type BetterSqliteConstructor = new (filePath: string) => SqliteDatabase;
type NodeSqliteModule = {DatabaseSync: new (filePath: string) => SqliteDatabase};
const requireFromHere = createRequire(import.meta.url);

declare global {
  // Keep one connection across Next.js development hot reloads.
  // eslint-disable-next-line no-var
  var __whiteboardStudioDb: SqliteDatabase | undefined;
}

export function getDataDirectory(): string {
  if (process.env.STUDIO_DATA_DIR) return resolve(process.env.STUDIO_DATA_DIR);
  // Keep creator sources and rendered videos out of a checked-out repository
  // (and, on Windows, out of an often cloud-synchronised Documents folder).
  if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    return resolve(process.env.LOCALAPPDATA, "WhiteboardStudio", "data");
  }
  return resolve(process.cwd(), "data");
}

export function getDatabasePath(): string {
  return join(getDataDirectory(), "studio.db");
}

export function migrate(db: SqliteDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS project (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT,
      input_mode TEXT NOT NULL,
      target TEXT NOT NULL,
      status TEXT NOT NULL,
      dir TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS project_created_at_idx
      ON project(created_at DESC);
  `);
}

export function getDb(): SqliteDatabase {
  if (globalThis.__whiteboardStudioDb) {
    return globalThis.__whiteboardStudioDb;
  }

  const databasePath = getDatabasePath();
  mkdirSync(dirname(databasePath), { recursive: true });

  let db: SqliteDatabase;
  try {
    // better-sqlite3 remains the primary driver specified by Appendix A. It
    // has prebuilt binaries for the supported Node releases used in normal
    // installs. Node 24 may not have one yet on Windows, however, so use its
    // built-in synchronous SQLite driver as a local-only compatibility path.
    const BetterSqlite = requireFromHere(/* turbopackIgnore: true */ "better-sqlite3") as BetterSqliteConstructor;
    db = new BetterSqlite(databasePath);
    db.pragma?.("foreign_keys = ON");
    db.pragma?.("journal_mode = WAL");
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const unavailableNativeBinding = /better_sqlite3\.node|Could not locate the bindings file|MODULE_NOT_FOUND|Cannot find module ['"]better-sqlite3/i.test(detail);
    if (!unavailableNativeBinding) throw error;
    const {DatabaseSync} = requireFromHere(/* turbopackIgnore: true */ "node:sqlite") as NodeSqliteModule;
    db = new DatabaseSync(databasePath);
    db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  }
  migrate(db);

  globalThis.__whiteboardStudioDb = db;
  return db;
}
