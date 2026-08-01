# QuantOS

[![Community Edition](https://img.shields.io/badge/License-Community%20Edition-2ea44f)](LICENSE-COMMUNITY.md)
[![Commercial License](https://img.shields.io/badge/Commercial%20License-Available-0d6efd)](LICENSE-COMMERCIAL.md)

QuantOS is a local-first desktop study planner for the quantitative finance curriculum. It runs as a Tauri desktop app, stores data in SQLite, and keeps all user data on the machine.

## Installation

1. Install Node.js and Rust.
2. Install dependencies with `npm install`.
3. Start the desktop shell with `npm run tauri dev`.

## Development

- Frontend: `npm run dev:frontend`
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Tests: `npm run test`

## Build

- Frontend build: `npm run build`
- Rust checks: `cargo check`
- Rust build: `cargo build`
- Tauri bundle: `npm run tauri build`

## Architecture

- React + TypeScript UI in `src/`
- Zustand stores for curriculum, planner, spaced repetition, and local auth
- SQLite persistence in `src/services/`
- Tauri shell in `src-tauri/`

## Project Structure

- `src/pages/` - route-level screens
- `src/components/` - shared UI and shell components
- `src/stores/` - application state
- `src/services/` - persistence and bootstrap logic
- `tests/` - Vitest unit coverage

## Keyboard Shortcuts

- `Cmd/Ctrl + K` - open command palette
- `Esc` - close the command palette

## Known Limitations

- The app is single-user and local-only.
- Reminder scheduling is local and only fires while the app is running.

## Future Improvements

- Rich text notes
- Deeper analytics filtering
- More advanced reminder scheduling
- Additional curriculum content and project templates

## Licensing

QuantOS uses a dual-licensing model.

### Community Edition

The Community Edition is free for personal learning, students, educators, research, and non-commercial use.

### Commercial Edition

Commercial use requires a separate commercial license. This includes organizational use, redistribution, bundling, embedding, and other use cases outside the Community Edition terms.

### Commercial Inquiries

If you need a commercial license, contact `commercial@quantos.dev` or visit https://quantos.dev/licensing.

For the full policy, see [LICENSING.md](LICENSING.md).

## Repository Guidance

Recommended GitHub settings for this repository:

- Repository visibility: public for Community Edition distribution, with commercial terms handled separately
- GitHub topics: `tauri`, `react`, `typescript`, `sqlite`, `desktop-app`, `education`, `finance`, `productivity`
- Repository description: `QuantOS is a local-first desktop study planner for quantitative finance.`
- Repository homepage: `https://quantos.dev`
- Social preview: use a clean product screenshot showing the dashboard and roadmap