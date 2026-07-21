import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {DatabaseSync} from "node:sqlite";
import BetterSqlite from "better-sqlite3";

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
    // Keep the native package for supported Node releases and deployments.
    db = new BetterSqlite(databasePath) as unknown as SqliteDatabase;
    db.pragma?.("foreign_keys = ON");
    db.pragma?.("journal_mode = WAL");
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const unavailableNativeBinding = /better_sqlite3\.node|Could not locate the bindings file|MODULE_NOT_FOUND|ERR_DLOPEN_FAILED/i.test(detail);
    if (!unavailableNativeBinding) throw error;
    // Node 24 ships SQLite, avoiding a local C++ toolchain when the native
    // better-sqlite3 binary was built for a different Node ABI.
    db = new DatabaseSync(databasePath) as unknown as SqliteDatabase;
    db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  }
  migrate(db);

  globalThis.__whiteboardStudioDb = db;
  return db;
}
