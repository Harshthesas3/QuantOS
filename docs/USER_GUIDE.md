# QuantOS - User Guide

QuantOS is a **local-first** desktop study planner for the
quantitative-finance curriculum described in `QuantOS_PRD_Specification.pdf`.
All data lives in a SQLite database on your machine; nothing is sent to a
remote server.

## First launch

1. Start the app (`npm run dev:frontend` in dev or your built Tauri bundle).
2. You will see the **Create your local account** screen.
3. Pick a username and a password (at least 6 characters). The password is
   stored on disk as an Argon2id hash - we never store the cleartext.
4. Sign in on every subsequent launch.

## Routes

| Path         | Page           | What it does                                                  |
|--------------|----------------|---------------------------------------------------------------|
| `/`          | Dashboard      | At-a-glance progress, today tasks, study intensity heatmap    |
| `/roadmap`   | Roadmap        | All 11 phases, node status, search, filters                  |
| `/topic/:id` | TopicDetails   | Drill into a node: notes, mastery checklist, hours, flashcards |
| `/planner`   | DailyPlanner   | Tasks + timer + daily reflection + revision session          |
| `/analytics` | Analytics      | Charts: weekly/monthly hours, SM-2 distribution, phase progress |
| `/settings`  | Settings       | Theme, account, data management                              |

## Buttons that work

Every actionable control below updates state and persists across restarts.

- Dashboard -> Start Timer jumps to the planner with an active study timer.
- Roadmap: the cycle status button walks a node through
  LOCKED -> UNLOCKED -> IN_PROGRESS -> COMPLETED -> MASTERED -> LOCKED.
  Completing dependencies auto-unlocks dependents.
- TopicDetails:
  - Cycle Status updates + cascades through the DAG.
  - Start Study creates a planner task and starts the timer.
  - Log Hours records actual time spent on the node.
  - Save Notes writes through to SQLite.
  - Toggle Mastery flips [x] criteria.
  - Add / Delete Resource persists changes.
  - Add Flashcard adds an SM-2 card linked to the node.
- DailyPlanner:
  - Add Task creates a prioritised daily task.
  - Play / Square toggle the active study timer per task.
  - Submit Review scores 0-5 against an SM-2 card.
  - Stop Timer folds elapsed minutes into the linked node actualHours.
  - Save Daily Log persists focus rating and reflection.
  - Edit / Reorder / Delete tasks all work.
- Analytics charts are read-only.
- Settings:
  - Theme switch between dark and light.
  - Change password re-hashes with Argon2id.
  - Export Data writes a JSON backup.
  - Import Data wipes and re-imports from JSON.
  - Reset Progress requires typing RESET then clicking again.

## Data location

| Where              | Path                                   |
|--------------------|----------------------------------------|
| Tauri (production) | AppDataDir/quantos.db                  |
| Web / dev          | cwd/.quantos/quantos.db                |

Delete that file to factory-reset.

## Tests

```
npm run type-check        # TypeScript strict mode
npm run lint              # ESLint
npm run test              # Vitest unit suite (29 tests)
npm run build:frontend    # vite build -> dist/
```

