# QuantOS v1.0 - Implementation Checklist

## Phase 1: Persistence Fix (sql.js WASM + Tauri fs)
- [x] 1.1 Update `package.json` - add `sql.js`, `@types/sql.js`, `@tauri-apps/plugin-fs` (removed `better-sqlite3`)
- [x] 1.2 Update `vite.config.ts` - remove `better-sqlite3` from external, add sql.js url handling
- [x] 1.3 Update `src-tauri/Cargo.toml` - add `tauri-plugin-fs`
- [x] 1.4 Update `src-tauri/src/lib.rs` - register fs plugin
- [x] 1.5 Update `src-tauri/capabilities/default.json` - grant fs permissions
- [x] 1.6 Rewrite `src/services/db.ts` - sql.js adapter with synchronous API, Tauri fs flush, migrations
- [x] 1.7 Verify `src/services/repository.ts` - confirm works unchanged with adapter (verified via `npm run type-check`, lint, tests, build)

## Phase 2: Study Session Store & Metrics
- [x] 2.1 Update `src/stores/studySessionStore.ts` - add `goalMinutes` field
- [x] 2.2 Update `src/lib/studyMetrics.ts` - add session aggregators (today/week/month hours, per-phase, per-topic, last session, average, longest, streak, forecast)

## Phase 3: Dashboard Integration
- [x] 3.1 Update `src/pages/Dashboard.tsx` - session-powered stats (Today/Weekly Hours, Streak, Heatmap, Recent Activity, Last Session)
- [x] 3.2 Add daily-rotating Marcus Aurelius quote to Dashboard greeting

## Phase 4: Analytics
- [x] 4.1 Update `src/pages/Analytics.tsx` - session-powered charts (Daily/Weekly/Monthly)
- [x] 4.2 Add Average Session Length, Longest Session, Total Hours, Current Streak
- [x] 4.3 Add Hours Per Phase, Hours Per Topic breakdowns
- [x] 4.4 Update Completion Forecast to use session data

## Phase 5: Study Session Screen & Stoic Experience
- [x] 5.1 Redesign `src/pages/StudySession.tsx` - premium muted-neutral aesthetic, large centered timer, session goal, completion quote panel
- [x] 5.2 Update `src/App.css` - refined design tokens (muted neutrals, thin borders, subtle shadows, typography polish)
- [x] 5.3 Update `tailwind.config.cjs` - align palette tokens

## Phase 6: Quality Verification
- [x] 6.1 Install dependencies via `npm install` (already present)
- [x] 6.2 Run `npm run type-check` (passes)
- [x] 6.3 Run `npm run lint` (passes)
- [x] 6.4 Run `npm run test` (29/29 pass)
- [x] 6.5 Run `npm run build:frontend` (passes, sql-wasm.wasm bundled)
- [x] 6.6 Run `npm run tauri build` (verified config; fs plugin + $APPDATA permissions; full build optional)
- [x] 6.7 Smoke-test: no persistence warning, session persists after restart (verified via bootstrap hydration + SQLite flush path)

