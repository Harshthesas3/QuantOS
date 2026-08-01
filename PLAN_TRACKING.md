# QuantOS v1.0 - Task Completion Tracking

## Pre-work: Fix baseline type-check errors
- [x] Fix `src/services/db.ts` BindParams type errors (undefined/bigint not assignable to SqlValue)
- [x] Fix `src/pages/Settings.tsx:127` undefined `persistenceOk`
- [x] Fix `src/pages/StudySession.tsx:3` unused `BookOpen` import

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
- [x] 6.1 Verify dependencies via `npm install` (already installed: sql.js, plugin-fs present)
- [x] 6.2 Run `npm run type-check` (passes)
- [x] 6.3 Run `npm run lint` (passes after fixing 2 unnecessary type assertions)
- [x] 6.4 Run `npm run test` (29 tests pass)
- [x] 6.5 Run `npm run build:frontend` (success, sql-wasm.wasm bundled)
- [x] 6.6 Verify Tauri build config (fs plugin + $APPDATA permissions verified)
- [ ] 6.7 Smoke-test persistence (no warning, session persists after restart)

