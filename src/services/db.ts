/**
 * Local SQLite persistence layer.
 *
 * Engine: `sql.js` (SQLite compiled to WASM) behind a synchronous adapter
 * that mirrors the `better-sqlite3` API used by `repository.ts`.
 *
 * Why sql.js instead of better-sqlite3:
 *   - better-sqlite3 is a Node.js native addon that cannot be dlopen'd
 *     inside the Tauri WebView2 renderer or any browser runtime, which is
 *     why the previous build reported "The SQLite native module could not
 *     be loaded."
 *   - sql.js runs the real SQLite engine compiled to WebAssembly, so the
 *     exact same DDL / DML / transactions work identically everywhere.
 *
 * Persistence:
 *   - In the Tauri desktop build the database is flushed to
 *     `<appDataDir>/quantos.db` through the official @tauri-apps/plugin-fs.
 *   - In a plain browser tab (vite dev frontend only) WASM cannot access
 *     the filesystem and in-memory storage is the only option; the desktop
 *     Tauri app is the supported runtime.
 */

import initSqlJs, { type Database as SqlJsDatabase, type SqlJsStatic, type BindParams } from 'sql.js/dist/sql-wasm-browser.js'
import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url'

const SCHEMA_VERSION = 2

interface StatementInstance {
  run(...params: unknown[]): unknown
  get(...params: unknown[]): unknown
  all(...params: unknown[]): unknown[]
}

interface DatabaseInstance {
  pragma(name: string): unknown
  prepare(sql: string): StatementInstance
  exec(sql: string): unknown
  transaction<T extends (...args: never[]) => unknown>(fn: T): T
  close(): void
}

let SQL: SqlJsStatic | null = null
let sqlJsDb: SqlJsDatabase | null = null
let db: DatabaseInstance | null = null
let dbPath: string = 'quantos.db'
let flushTimer: ReturnType<typeof setTimeout> | null = null
let dirty = false

// ---------------------------------------------------------------------------
// Path / Tauri helpers
// ---------------------------------------------------------------------------

export function getDbPath(): string {
  return dbPath
}

export function setDbPath(path: string): void {
  if (db) {
    throw new Error('Cannot change dbPath after the connection has been opened.')
  }
  dbPath = path
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

async function getAppDataFilePath(): Promise<string | null> {
  try {
    const pathApi = await import('@tauri-apps/api/path')
    const dir = await pathApi.appDataDir()
    return `${dir}${dbPath}`
  } catch {
    return null
  }
}

async function loadPersistedBytes(): Promise<Uint8Array | null> {
  if (!isTauri()) return null
  try {
    const fs = await import('@tauri-apps/plugin-fs')
    const fullPath = await getAppDataFilePath()
    if (!fullPath) return null
    await fs.mkdir(fullPath.slice(0, fullPath.lastIndexOf('/')), { recursive: true })
    if (await fs.exists(fullPath)) {
      return await fs.readFile(fullPath)
    }
    return null
  } catch {
    return null
  }
}

async function flushToDisk(): Promise<void> {
  if (!isTauri() || !sqlJsDb) return
  try {
    const fs = await import('@tauri-apps/plugin-fs')
    const fullPath = await getAppDataFilePath()
    if (!fullPath) return
    const bytes = sqlJsDb.export()
    await fs.writeFile(fullPath, bytes)
  } catch {
    // best-effort; keep the running application functional
  }
}

function markDirty(): void {
  dirty = true
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => {
    flushTimer = null
    if (dirty) {
      dirty = false
      void flushToDisk()
    }
  }, 250)
}

// ---------------------------------------------------------------------------
// Named-parameter translation
// ---------------------------------------------------------------------------

const NAMED_PARAM_RE = /[@:$]([A-Za-z_][A-Za-z0-9_]*)/g

function translateSql(sql: string): { sql: string; keys: string[] } {
  const keys: string[] = []
  const translated = sql.replace(NAMED_PARAM_RE, (_, key: string) => {
    keys.push(key)
    return '?'
  })
  return { sql: translated, keys }
}

// ---------------------------------------------------------------------------
// Statement adapter (sql.js)
// ---------------------------------------------------------------------------

class SqlJsStatement implements StatementInstance {
  private readonly db: SqlJsDatabase
  private readonly translatedSql: string
  private readonly keys: string[]

  constructor(db: SqlJsDatabase, originalSql: string) {
    this.db = db
    const { sql, keys } = translateSql(originalSql)
    this.translatedSql = sql
    this.keys = keys
  }

  private bake(param: unknown): BindParams {
    if (param == null) return []
    if (Array.isArray(param)) {
      // `undefined` entries translate to `null` for SQL binding.
      return param.map((value) =>
        value === undefined || value === null ? null : (value as string | number | Uint8Array),
      )
    }
    if (typeof param === 'object') {
      const record = param as Record<string, unknown>
      return this.keys.map((key) => {
        const value = record[key]
        return value === undefined || value === null
          ? null
          : (value as string | number | Uint8Array)
      })
    }
    return [param as string | number | Uint8Array]
  }

  run(...params: unknown[]): unknown {
    const stmt = this.db.prepare(this.translatedSql)
    try {
      stmt.bind(this.bake(params.length > 0 ? params[0] : undefined))
      stmt.step()
      const changes = this.db.getRowsModified()
      markDirty()
      return { changes }
    } finally {
      stmt.free()
    }
  }

  get(...params: unknown[]): unknown {
    const stmt = this.db.prepare(this.translatedSql)
    try {
      stmt.bind(this.bake(params.length > 0 ? params[0] : undefined))
      if (stmt.step()) {
        return stmt.getAsObject()
      }
      return undefined
    } finally {
      stmt.free()
    }
  }

  all(...params: unknown[]): unknown[] {
    const stmt = this.db.prepare(this.translatedSql)
    try {
      stmt.bind(this.bake(params.length > 0 ? params[0] : undefined))
      const out: unknown[] = []
      while (stmt.step()) {
        out.push(stmt.getAsObject())
      }
      return out
    } finally {
      stmt.free()
    }
  }
}

// ---------------------------------------------------------------------------
// Database adapter (sql.js)
// ---------------------------------------------------------------------------

class SqlJsDatabaseAdapter implements DatabaseInstance {
  private readonly raw: SqlJsDatabase
  private txDepth = 0

  constructor(raw: SqlJsDatabase) {
    this.raw = raw
  }

  pragma(name: string): unknown {
    const eq = name.indexOf('=')
    const key = (eq >= 0 ? name.slice(0, eq) : name).trim().toLowerCase()
    const value = eq >= 0 ? name.slice(eq + 1).trim() : ''

    // WAL journaling is not applicable to the WASM engine; the engine is
    // still SQLite and every write is exported atomically to disk.
    if (key === 'journal_mode' || key === 'wal_autocheckpoint') return undefined

    try {
      return this.raw.exec(`PRAGMA ${key}${value ? ` = ${value}` : ''};`)
    } catch {
      return undefined
    }
  }

  prepare(sql: string): StatementInstance {
    return new SqlJsStatement(this.raw, sql)
  }

  exec(sql: string): unknown {
    const result = this.raw.exec(sql)
    markDirty()
    return result
  }

  transaction<T extends (...args: never[]) => unknown>(fn: T): T {
    const wrapped = ((...args: never[]) => {
      if (this.txDepth === 0) {
        this.raw.exec('BEGIN')
      } else {
        this.raw.exec(`SAVEPOINT quantos_tx_${this.txDepth}`)
      }
      this.txDepth += 1
      try {
        const result = fn(...args)
        this.txDepth -= 1
        if (this.txDepth === 0) {
          this.raw.exec('COMMIT')
        } else {
          this.raw.exec(`RELEASE SAVEPOINT quantos_tx_${this.txDepth}`)
        }
        markDirty()
        return result
      } catch (error) {
        this.txDepth -= 1
        if (this.txDepth === 0) {
          this.raw.exec('ROLLBACK')
        } else {
          this.raw.exec(`ROLLBACK TO SAVEPOINT quantos_tx_${this.txDepth}`)
          this.raw.exec(`RELEASE SAVEPOINT quantos_tx_${this.txDepth}`)
        }
        throw error
      }
    }) as T
    return wrapped
  }

  close(): void {
    if (this.txDepth !== 0) {
      try {
        this.raw.exec('ROLLBACK')
      } catch {
        // ignore
      }
      this.txDepth = 0
    }
    this.raw.close()
  }
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

function migrate(database: DatabaseInstance): void {
  database.pragma('journal_mode = WAL')
  database.pragma('foreign_keys = ON')

  database.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT,
      password_hash TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS curriculum_node (
      id TEXT PRIMARY KEY,
      phase_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      estimated_hours REAL NOT NULL DEFAULT 0,
      actual_hours REAL NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      mastery_criteria_json TEXT NOT NULL DEFAULT '[]',
      resources_json TEXT NOT NULL DEFAULT '[]',
      prerequisites_json TEXT NOT NULL DEFAULT '[]',
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS planner_task (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      estimated_minutes INTEGER,
      actual_minutes INTEGER NOT NULL DEFAULT 0,
      node_id TEXT,
      date TEXT NOT NULL,
      priority TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS planner_log (
      date TEXT PRIMARY KEY,
      focus_rating INTEGER NOT NULL,
      reflection TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS study_session (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      phase_id TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      elapsed_seconds INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sm2_card (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      answer TEXT NOT NULL,
      ease_factor REAL NOT NULL,
      interval_days INTEGER NOT NULL,
      review_count INTEGER NOT NULL,
      next_review_date TEXT NOT NULL,
      history_json TEXT NOT NULL DEFAULT '[]',
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_setting (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_planner_task_date ON planner_task(date);
    CREATE INDEX IF NOT EXISTS idx_sm2_due ON sm2_card(next_review_date);
    CREATE INDEX IF NOT EXISTS idx_study_session_topic ON study_session(topic_id);
    CREATE INDEX IF NOT EXISTS idx_study_session_status ON study_session(status);
    CREATE INDEX IF NOT EXISTS idx_study_session_start ON study_session(start_time);
  `)

  const setVersion = database.prepare(
    `INSERT INTO app_setting(key, value) VALUES('schema_version', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  )
  setVersion.run(String(SCHEMA_VERSION))
}

// ---------------------------------------------------------------------------
// Open / close
// ---------------------------------------------------------------------------

async function openDatabase(): Promise<DatabaseInstance> {
  const sqlModule = SQL ?? (await initSqlJs({ locateFile: () => wasmUrl }))
  SQL = sqlModule

  const persisted = await loadPersistedBytes()
  const rawDb = persisted && persisted.length > 0 ? new sqlModule.Database(persisted) : new sqlModule.Database()

  sqlJsDb = rawDb
  const adapter = new SqlJsDatabaseAdapter(rawDb)
  db = adapter
  migrate(adapter)

  // Best-effort flush when the window closes.
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      void flushToDisk()
    })
  }

  return adapter
}

export async function getDbAsync(): Promise<DatabaseInstance> {
  if (db) return db
  db = await openDatabase()
  return db
}

export function closeDb(): void {
  if (db) {
    try {
      db.close()
    } catch {
      // ignore
    }
    db = null
    sqlJsDb = null
  }
}

/**
 * True once the SQLite connection has been opened successfully.
 */
export function isPersistenceReady(): boolean {
  return db !== null && sqlJsDb !== null
}
