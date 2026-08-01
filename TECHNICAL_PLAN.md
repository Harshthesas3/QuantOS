# QuantOS Technical Design Document

> **Status:** This is the authoritative technical plan for the current product.
> It has been revised to match the application that is actually being built:
> a **local-first, single-user quantitative-finance study planner** for Windows,
> delivered as a Tauri desktop app with a SQLite-backed persistence layer.

## 1. Product Vision

QuantOS is a **local-first desktop application** that helps a single learner
master the quantitative-finance curriculum described in the PRD. The app is
not a SaaS, not multi-user, not deployed publicly.

- 11 phases across 73 curriculum nodes (JEE math, advanced math, Python, ML,
  time series, financial economics, stochastic finance, alpha research, C++
  research engineering, paper replications, portfolio projects).
- A roadmap with a DAG prerequisite structure that unlocks each node only
  when its prerequisites are complete.
- A daily planner with tasks, time tracking, daily reflection, and
  carry-over of unfinished work.
- An SM-2 spaced-repetition flashcard engine bound to curriculum nodes.
- An analytics dashboard for streaks, velocity, phase progress, and EF
  distribution.
- Settings for theme, import/export of local backups, and full reset.

All persistence is to a SQLite database inside the Tauri-managed application
data directory.

## 2. Architecture

### 2.1 Process model

- **Tauri 2** wraps a React 19 SPA on Windows, macOS, and Linux.
- The Rust side currently only logs in debug builds (`tauri-plugin-log`).
  The application data itself lives in a **better-sqlite3** database
  accessed through a `services/db.ts` module that runs in the renderer.
- A single **React Router v6** browser router wires the protected routes.
- **Zustand stores** are the source of truth in memory; they hydrate from
  SQLite on app boot and write back through a thin subscription layer.

### 2.2 Folder structure

```
src/
  App.tsx
  App.css
  main.tsx
  env.d.ts
  components/
    CommandPalette.tsx
    ErrorBoundary.tsx
    layout/Navigation.tsx
    ui/                 # button, card, badge, input, select, dialog,
                        # tooltip, tabs, progress, toast, separator,
                        # empty-state
  hooks/
    useTimerTicker.ts
  lib/
    toast.ts
    utils.ts
  pages/
    Dashboard.tsx
    Roadmap.tsx
    TopicDetails.tsx
    DailyPlanner.tsx
    Analytics.tsx
    Settings.tsx
    Login.tsx
  routes/index.tsx
  services/
    db.ts
    repository.ts
  stores/
    userStore.ts
    curriculumStore.ts
    plannerStore.ts
    spacedRepetitionStore.ts
  types/

src-tauri/
  Cargo.toml
  tauri.conf.json
  capabilities/default.json
  src/{main.rs, lib.rs}

tests/
  setup.ts
  unit/
    curriculumStore.test.ts
    spacedRepetition.test.ts
    plannerStore.test.ts

docs/
  USER_GUIDE.md
```

The `backend/` Rust kernel/drivers/fs/mm/scheduler/sync tree described in the
previous revision does **not exist** and is **not part of the implementation
plan**. References to OS-simulator modules in the PRD are intentionally out of
scope for this product.

## 3. Status legend

- **Implemented** - working in the current codebase and reachable from the UI.
- **In Progress** - wired up but contains a known gap documented in the
  Implementation Gaps section.
- **Future Enhancements** - explicit non-goals for the current release;
  listed for transparency, not scheduled work.

## 4. Implemented

### 4.1 Frontend

- React 19 + TypeScript SPA mounted via `src/main.tsx` and routed by
  `src/routes/index.tsx`.
- Tailwind 3 with hand-tuned design tokens in `App.css` (`#0D0E12`
  background, `#38BDF8` accent, IBM Plex Sans stack).
- shadcn-style primitives built on Radix: button, card, badge, input,
  select, dialog, tooltip, tabs, progress, toast, separator, empty-state.
- Command palette opens via `Cmd/Ctrl+K`, searches curriculum nodes, and
  navigates.
- Navigation bar with active route highlighting and live timer chip.
- Toast container with success / error / info / warning variants.
- ErrorBoundary at `App.tsx` level catches render crashes and offers
  reload instead of an empty screen.

### 4.2 Routing

| Path          | Component     | Protection                 |
|---------------|---------------|----------------------------|
| `/`           | Dashboard     | auth                       |
| `/roadmap`    | Roadmap       | auth                       |
| `/topic/:id`  | TopicDetails  | auth                       |
| `/planner`    | DailyPlanner  | auth                       |
| `/analytics`  | Analytics     | auth                       |
| `/settings`   | Settings      | auth                       |
| `/login`      | Login         | redirect-if-authenticated  |
| `*`           | redirect `/`  | -                          |

### 4.3 Stores

| Store                   | Responsibility                                                          |
|-------------------------|-------------------------------------------------------------------------|
| `userStore`             | Local user record, login/logout, settings profile                      |
| `curriculumStore`       | 73-node DAG, status transitions, critical-path, per-node notes          |
| `plannerStore`          | Daily tasks, priority, estimates, timer, daily log, carry-over          |
| `spacedRepetitionStore` | SM-2 cards, ease-factor / interval / review-count, history, due count   |

### 4.4 Study engine

- SM-2 algorithm in `spacedRepetitionStore.submitReview`: ease floor 1.3,
  interval reset on score < 3, history log per review.
- Critical-path analysis in `curriculumStore.getCriticalPath`: DAG
  longest-path over estimated hours, computed via a memoized DFS that is
  invalidated on every status change.
- Streak calculation in `Analytics` (`longestStreak`).

### 4.5 Local persistence (SQLite)

- SQLite via `services/db.ts` (better-sqlite3 prebuilt binary, single file at
  `<appDataDir>/quantos.db`, with a `<cwd>/.quantos/quantos.db` fallback for
  `vite dev` outside Tauri).
- Migration runner creates the schema on first launch and writes
  `schema_version` to `app_setting`.
- Stores hydrate from SQLite on boot and persist on change via the
  `repository.ts` helpers.

### 4.6 SQLite schema

```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT,
  password_hash TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE curriculum_node (
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

CREATE TABLE planner_task (
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

CREATE TABLE planner_log (
  date TEXT PRIMARY KEY,
  focus_rating INTEGER NOT NULL,
  reflection TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);

CREATE TABLE sm2_card (
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

CREATE TABLE app_setting (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### 4.7 Auth

- Single local account with Argon2id password hash using `argon2-browser`.
- Login screen is a real username + password form.
- If `better-sqlite3` cannot load in a given environment,
  the app falls back to a username-only local gate so existing users are
  not locked out.
- No remote authentication, no JWT, no OAuth, no password reset.

### 4.8 Tauri shell

- `src-tauri/tauri.conf.json` sets the window to 1280x800 (was 800x600).
- `capabilities/default.json` allows `core:default`.
- No code signing, updater, store metadata, or remote build pipeline.

### 4.9 Tests

- Vitest 1 with jsdom and `@testing-library/react` 16.
- One test file per store for the deterministic reducer logic.
- Mocks `localStorage` and seeds the database in-memory (better-sqlite3
  `:memory:`).

### 4.10 Quality-of-life

- Error boundary at `App.tsx` level.
- `Toast` container with `role="status"` and `aria-live="polite"`.
- `aria-label` on every icon-only button.

## 5. In Progress (closing in this pass)

- `curriculumStore.getCriticalPath` memoization: the memo object is reset on
  every `updateNodeStatus` call.
- `Roadmap.tsx` declared-but-not-defined state: `searchQuery` and
  `expandedPhases` were used before any `useState`.
- `DailyPlanner.tsx` use-before-define for revision state hooks.
- `TopicDetails.handleDeleteResource` now removes the resource from the
  store rather than only firing a toast.
- Timer minutes roll into the linked node's `actualHours` when a timer is
  stopped.
- Settings theme toggle flips a real CSS variable override.
- Settings import/export buttons are properly scoped.

## 6. Future Enhancements (explicit non-goals)

The following are intentionally not implemented:

- Cloud sync, remote API, OAuth, JWT, multi-user.
- OS-simulator kernel / scheduler / MM / FS modules.
- FlexSearch global search index (CommandPalette does linear in-memory
  search).
- Playwright e2e.
- Microsoft Store / Mac App Store submission, code signing, auto-update.
- CI/CD, GitHub Actions, conventional-commit linter, automatic changelog
  generation, bundle metadata.
- Markdown rendering of node notes.

## 7. Local persistence contract

### 7.1 Storage location

- **Tauri build**: `<AppDataDir>/quantos.db`.
- **Web fallback (dev)**: `<cwd>/.quantos/quantos.db`.

### 7.2 Hydration order on boot

1. `services/db.ts` opens the connection and runs pending migrations.
2. `repository.ts` reads each table into a plain JS object.
3. Stores call `replaceAll(...)` on hydration; first launch seeds 73 nodes.
4. Subsequent store mutations persist via `INSERT OR REPLACE` in a transaction.

### 7.3 Backups

- Settings -> Data Management -> Export Data writes a JSON document.
- Import Data validates JSON, opens a transaction, wipes each table, and
  re-inserts.

## 8. Auth contract

- First launch: "Create your local account" form sets username + password.
- Password is Argon2id-hashed with the argon2-browser defaults.
- Subsequent launches show the same form in "Sign in" mode; hash verified
  via `argon2.verify`.
- Wrong password surfaces a toast error and refuses to write to stores.

## 9. Quality bar

- TypeScript with `strict: true` and `noUnusedLocals/Parameters`.
- Vitest unit suite green.
- `npm run type-check`, `npm run lint`, `npm run test`, `npm run
  build:frontend` succeed on Windows + macOS dev machines.
- Every button on every page performs a real, observable action that
  changes store state and persists.
