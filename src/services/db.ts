/**
 * Local SQLite persistence layer.
 *
 * In a Tauri build the database lives under the app data directory.
 * In `vite dev` it lives under `<cwd>/.quantos/quantos.db`.
 *
 * Both `better-sqlite3` and `node:fs` are dynamically imported so the
 * Vite renderer build (which externalizes them) does not try to resolve
 * them at bundle time.
 */

const SCHEMA_VERSION = 1

type DatabaseInstance = {
  pragma(name: string): unknown
  prepare(sql: string): {
    run(...params: unknown[]): unknown
    get(...params: unknown[]): unknown
    all(...params: unknown[]): unknown[]
  }
  exec(sql: string): unknown
  transaction<T extends (...args: never[]) => unknown>(fn: T): T
  close(): void
}

type DatabaseCtor = {
  new (filename: string): DatabaseInstance
}

let db: DatabaseInstance | null = null
let dbPath: string | null = null

function defaultDbPath(): string {
  return `${typeof process !== 'undefined' ? process.cwd() : '.'}/.quantos/quantos.db`
}

function resolveDir(filePath: string): string {
  const idx = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
  return idx === -1 ? '.' : filePath.slice(0, idx)
}

export function getDbPath(): string {
  return dbPath ?? defaultDbPath()
}

export function setDbPath(path: string): void {
  if (db) {
    throw new Error('Cannot change dbPath after the connection has been opened.')
  }
  dbPath = path
}

async function ensureDir(dir: string): Promise<void> {
  try {
    const fs = (await import('node:fs')) as { mkdirSync(p: string, opts: { recursive: boolean }): void }
    fs.mkdirSync(dir, { recursive: true })
  } catch {
    // best-effort; better-sqlite3 will surface a clearer error if it cannot open
  }
}

async function loadBetterSqlite(): Promise<DatabaseCtor> {
  const mod = (await import('better-sqlite3')) as unknown as { default: DatabaseCtor }
  return mod.default
}

async function openDatabase(): Promise<DatabaseInstance> {
  const Ctor = await loadBetterSqlite()
  const path = getDbPath()
  const dir = resolveDir(path)
  await ensureDir(dir)
  const database = new Ctor(path)
  migrate(database)
  return database
}

function migrate(database: DatabaseInstance): void {
  const pragma = (name: string, value: string) => {
    database.pragma(`${name} = ${value}`)
  }
  pragma('journal_mode', 'WAL')
  pragma('foreign_keys', 'ON')

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
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      estimated_hours REAL NOT NULL,
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
  `)

  const setVersion = database.prepare(
    `INSERT INTO app_setting(key, value) VALUES('schema_version', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  )
  setVersion.run(String(SCHEMA_VERSION))
}

export async function getDbAsync(): Promise<DatabaseInstance> {
  if (db) return db
  db = await openDatabase()
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function isPersistenceReady(): boolean {
  // The presence of `process.versions.node` indicates we are running
  // under Node-style APIs (Tauri renderer has them, the browser does
  // not). For local-first builds we still let the renderer attempt
  // `getDbAsync` and surface a useful UI fallback when it fails.
  return typeof process !== 'undefined' && typeof process.versions === 'object' && typeof process.versions.node === 'string'
}
