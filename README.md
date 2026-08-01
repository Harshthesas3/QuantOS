<div align="center">

<img width="1254" height="1254" alt="image" src="https://github.com/user-attachments/assets/e41ef57b-f1f3-42cf-8aa8-b18fed86c8eb" />


# QuantOS

### A personal operating system for becoming a world-class quantitative researcher.

QuantOS is a local-first desktop study planner built around the quantitative finance
curriculum. It runs as a native Tauri desktop app, persists every byte of data in
SQLite, and keeps everything on your machine — fast, private, and offline by design.

<br/>

[![Community Edition](https://img.shields.io/badge/License-Community%20Edition-2ea44f)](LICENSE-COMMUNITY.md)
[![Commercial License](https://img.shields.io/badge/Commercial%20License-Available-0d6efd)](LICENSE-COMMERCIAL.md)
[![React 19](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178C6)](https://www.typescriptlang.org)
[![Tauri 2](https://img.shields.io/badge/Tauri-2-24C8DB)](https://tauri.app)
[![SQLite](https://img.shields.io/badge/SQLite-Embedded-003B57)](https://www.sqlite.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF)](https://vitejs.dev)
[![Offline-first](https://img.shields.io/badge/Offline-first-111318)]()

</div>

---

## Screenshots

> Image placeholders — capture real screenshots and save them as the paths below.
> Recommended: 1440 × 900, dark theme.

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/02e3cff8-3ca3-4ed4-9ffe-98f7e1cd3fa4" />

<p align="center">
  <img src="docs/images/dashboard.png" alt="QuantOS Dashboard" width="720" />
  <br/>
  <em>The dashboard — today's mission, live metrics, and study activity in one view.</em>
</p>

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/30f29b5e-8340-437d-8701-744373661a29" />

<p align="center">
  <img src="docs/images/roadmap.png" alt="QuantOS Roadmap" width="720" />
  <br/>
  <em>The roadmap — eleven phases from JEE mathematics to portfolio alpha research.</em>
</p>

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/373fa8fc-63d7-4e9a-8d2b-888f8f967df6" />

<p align="center">
  <img src="docs/images/study.png" alt="QuantOS Study Session" width="720" />
  <br/>
  <em>A focused study session — timer, quote, and notes without distractions.</em>
</p>

---

## Features

| | Feature | Description |
|---|---|---|
| 🎯 | **Dashboard** | A calm, information-dense home: today's mission, completion, streaks, weekly hours, and a study heatmap. |
| 🗺️ | **Roadmap** | A 90+ topic curriculum across 11 phases, from calculus foundations to production alpha research. |
| 📅 | **Study Planner** | Daily tasks, priorities, per-task timers, and unfinished work carried forward automatically. |
| ⏱️ | **Study Timer** | Stopwatch and countdown modes, pause/resume, goal tracking, and per-session notes. |
| 📊 | **Analytics** | Sessions, focus time, streaks, spaced-repetition reviews, and phase-level completion. |
| 🧩 | **Projects** | Portfolio-scale projects (alpha framework, C++ engine, volatility arbitrage) tracked like topics. |
| 📝 | **Notes** | Topic-anchored notes written and read inline with every curriculum node. |
| 📚 | **Resources** | Books, videos, and papers per topic with status and rating tracking. |
| 📶 | **Offline-first** | No cloud, no accounts, no telemetry. Your machine is the server. |
| 🗄️ | **SQLite persistence** | All data stored locally in a single embedded SQLite database. |
| 🏛️ | **Stoic dashboard** | A daily Marcus Aurelius quote grounds each study session in purpose. |

<details>
<summary><strong>More</strong></summary>

<br/>

- 🔒 **Local authentication** — Argon2-hashed credentials, verified entirely on-device.
- ⌨️ **Command palette** — press `Ctrl/⌘ + K` to navigate anywhere instantly.
- 🔁 **Spaced repetition** — SM-2 review cards scheduled from any topic.
- ✨ **Premium UI** — a champagne-and-ink dark theme with 150 ms micro-interactions throughout.

</details>

---

## Why QuantOS?

> QuantOS is not another note-taking app.
>
> It is a **personal operating system** for becoming a world-class quantitative researcher —
> a single, always-available surface for the curriculum, the daily routine, and the
> evidence of progress that makes long-term mastery inevitable.

Most study tools optimize for *collecting* information. QuantOS is designed around a
different loop: **plan → study → record → review**. Every screen feeds the next one.
Your roadmap determines today's mission. Your timer records the session. The session
feeds analytics and spaced repetition. The system closes the loop while you focus on
the work.

And because everything lives in SQLite on your own machine, QuantOS is instant to open,
instant to search, and private by construction.

---

## Screens

| Screen | Purpose |
|---|---|
| **Dashboard** | Your mission, quote, metrics, recent sessions, and heatmap — the day's command center. |
| **Roadmap** | Explore and navigate the full curriculum with prerequisites, progress, and critical path. |
| **Study** | Dedicated focus mode: stopwatch/countdown, goal progress, session notes, and keyboard control. |
| **Planner** | Plan today's tasks, run per-task timers, and review due flashcards. |
| **Projects** | Portfolio-scale work tracked with the same status, mastery, and resource system as topics. |
| **Resources** | Every book, video, and paper across the curriculum, with status and ratings. |
| **Analytics** | Long-run evidence: focus hours, streaks, velocity, and phase completion. |
| **Settings** | Profile, authentication, appearance, reminders, and app preferences. |

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · TypeScript 5 · React Router 6 |
| **Backend** | Tauri 2 (Rust) — no external services, fully local |
| **Desktop** | Tauri 2 · WebView2 (Windows) / WebKitGTK (Linux) / WKWebView (macOS) |
| **Database** | SQLite (embedded, via `sql.js` WASM) |
| **State Management** | Zustand stores with persistence hydration |
| **Charts** | Recharts |
| **Styling** | Tailwind CSS · Radix UI primitives · IBM Plex typeface |
| **Build System** | Vite 5 · `tauri-cli` · Cargo |

---

## Folder Structure

```text
quantos/
├── src/
│   ├── components/        # Shared UI and shell (ui/, layout/)
│   ├── data/              # Curriculum seed data and quotes
│   ├── hooks/             # Timers, reminders, session tickers
│   ├── lib/               # Study metrics and toast helpers
│   ├── pages/             # Route-level screens
│   ├── routes/            # Router definitions and guards
│   ├── services/          # SQLite persistence, auth, bootstrap
│   ├── stores/            # Zustand stores (curriculum, planner, SRS, sessions)
│   └── types/             # Shared type declarations
├── src-tauri/             # Rust shell, capabilities, and bundling
├── tests/                 # Vitest unit coverage
├── index.html
├── package.json
└── vite.config.ts
```

---

## Installation

### Prerequisites

- **Node.js** 18+ and `npm`
- **Rust** stable toolchain (`rustup`)
- Platform webview dependencies:
  - **Windows** — WebView2 (preinstalled on modern Windows)
  - **Linux** — `webkit2gtk-4.1`, `libappindicator3`, and build essentials
  - **macOS** — Xcode Command Line Tools

### Development

```bash
# Install dependencies
npm install

# Launch the desktop app with hot reload
npm run dev

# Frontend-only dev server (http://localhost:5176)
npm run dev:frontend
```

### Production Build

```bash
# Full desktop bundle (NSIS installer + MSI on Windows)
npm run build

# Frontend-only production build
npm run build:frontend

# Quality gates
npm run verify       # type-check + lint + tests + frontend build
```

The compiled app ships as `QuantOS.exe` (Windows), with installers generated
under `src-tauri/target/release/bundle/`.

---

## Usage

A typical daily loop:

1. **Launch** QuantOS — the dashboard greets you with a quote and today's mission.
2. **Choose a topic** from the roadmap or pick the mission shown on the dashboard.
3. **Start the timer** — a study session begins (stopwatch or countdown to your goal).
4. **Study** — pause with `Space`, finish with `Enter`, capture notes inline.
5. **Session saved** — progress is written to SQLite the moment you finish.
6. **Analytics updated** — streaks, weekly hours, heatmap, and review scheduling update automatically.

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/⌘ + K` | Open command palette |
| `Space` | Start / pause / resume study session |
| `Enter` | Finish session |
| `Esc` | Close palette or leave current screen |

---

## Architecture

QuantOS is a thin, secure shell around a local database.

- **Tauri (Rust)** owns the window and the bundle. The frontend is served from
  bundled assets — no remote code, no external connections.
- **React + Zustand** model the entire domain in memory: curriculum nodes, sessions,
  planner tasks, SM-2 cards, and auth state.
- **`src/services/`** persist every store slice to a single embedded SQLite database
  (`sql.js` WASM), and rehydrate the app on launch — the same database is the
  source of truth for analytics.
- **Stores stay framework-agnostic** — the UI subscribes to Zustand selectors, so
  pages render only what they read.

```
┌─────────────┐    subscribe    ┌──────────────┐    hydrate    ┌─────────────┐
│   React UI  │ ─────────────▶  │ Zustand state│ ◀────────────▶ │  SQLite     │
│   pages     │   selectors     │   stores     │   persist     │  database   │
└─────────────┘                 └──────────────┘                └─────────────┘
        ▲                                                             ▲
        └────────── Tauri 2 desktop shell (Rust, bundled assets) ─────┘
```

---

## Roadmap

**Completed**

- [x] Offline-first Tauri desktop app with SQLite persistence
- [x] 11-phase quantitative finance curriculum with prerequisites and critical path
- [x] Focused study sessions with timers, goals, and notes
- [x] Daily planner with tasks, timers, and carry-over
- [x] Spaced repetition (SM-2) review scheduling
- [x] Local Argon2-based authentication
- [x] Command palette and keyboard-first navigation
- [x] Unified premium dark theme across all screens

**In progress**

- [ ] Rich text notes with formatting
- [ ] Deeper analytics filtering (per phase, per topic, date ranges)

**Future**

- [ ] Reminder scheduling that fires while the app is closed
- [ ] Expanded curriculum content and project templates
- [ ] Optional opt-in sync — never required, always local-first

---

## Contributing

QuantOS is a personal operating system, but it grows faster with thoughtful
contributors.

- Report bugs and request features via **GitHub Issues**.
- Open pull requests for fixes, curriculum content, or design polish.
- Keep changes focused, typed, and covered by the existing Vitest suite.
- Respect the licensing terms below before contributing.

```bash
npm run verify   # run before opening a pull request
```

---

## License

QuantOS uses a dual-licensing model.

### Community Edition

Free for personal learning, students, educators, research, and non-commercial use.
See [LICENSE-COMMUNITY.md](LICENSE-COMMUNITY.md).

### Commercial Edition

Required for organizational use, redistribution, bundling, embedding, and any use
outside the Community Edition terms. See [LICENSE-COMMERCIAL.md](LICENSE-COMMERCIAL.md).

**Commercial inquiries:** `commercial@quantos.dev` · [quantos.dev/licensing](https://quantos.dev/licensing)

The full policy is documented in [LICENSING.md](LICENSING.md).

---

## Author

**QuantOS** is designed and engineered for one reader — the future quant who refuses
to leave mastery to chance.

Built with discipline by [Harshthesas3](https://github.com/Harshthesas3).

<p align="center">
  <em>Plan. Study. Record. Review. — every day, offline, on your machine.</em>
</p>
