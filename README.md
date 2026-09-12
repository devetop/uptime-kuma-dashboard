# TypeScript Uptime Kuma Down Monitors Dashboard

A read-only, full-stack TypeScript dashboard visualizing monitors currently **down** in Uptime Kuma.

## Stack

- **Backend**: Node.js + Express 5 + TypeSQL (mysql2 / node:sqlite)
- **Frontend**: React 19 + Vite 6 + TypeScript + Tailwind CSS 4
- **DB driver**: Built-in `node:sqlite` or `mysql2` (no runtime dependency surprise)

## Prerequisites

- Node.js ≥ 22.14.0
- Either:
  - MariaDB / MySQL server (default Uptime Kuma config)
  - Or Uptime Kuma's default SQLite file (`data/kuma.db`)

## Quickstart

From the project root:

```bash
# 1. Install dependencies (both sides)
npm install

# 2. Fill in environment variables (see .env.example below)
#    The backend reads: DB_TYPE, DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASS (or DB_PATH for SQLite)
cp server/.env.example server/.env
#    Edit server/.env with your real values, or keep the SQLite path pointing at ./data/kuma.db

# 3. Start both servers (two terminals)
#    Backend:
npm run dev:server      # starts Express on http://localhost:4242
#    Frontend:
npm run dev             # starts Vite on http://localhost:5173
```

## Architecture

```
monitoring-dashboard/
├── server/           # Express API
│   ├── src/
│   │   ├── index.ts        # Entry point, DB-type detection
│   │   ├── lib/app.ts      # CORS, caching, /health
│   │   ├── lib/db-bridge.mysql.ts   # MySQL/MariaDB path
│   │   ├── lib/db-bridge.sqlite.ts  # SQLite path (node:sqlite built-in)
│   │   ├── lib/mappers.ts  # Row → DownMonitor mapping
│   │   └── lib/sql.ts      # Shared static query string
│   ├── package.json
│   └── tsconfig.json
├── frontend/         # Vite + React app
│   ├── src/
│   │   ├── main.tsx        # Render root
│   │   ├── App.tsx         # Layout, table, search, auto-refresh
│   │   ├── hooks/useDownMonitors.ts  # fetch + polling
│   │   ├── lib/api.ts      # /api/down-monitors client
│   │   ├── lib/errors.ts   # error-type badge classification
│   │   ├── lib/time.ts     # relativeTime / absoluteTime helpers
│   │   └── components/DownMonitorRow.tsx
│   ├── package.json
│   ├── tsconfig.app.json
│   └── vite.config.ts      # proxy: /api → http://localhost:4242
│── shared/           # Types shared by both sides
│   └── index.ts
│── package.json        # Root scripts: install:all, dev (two-terminal)
└── .gitignore
```

## Acceptance Criteria (checked)

- [x] `GET /api/down-monitors` returns JSON matching the sample row shape,
    sourced from the exact SQL query provided in the brief
- [x] Dashboard renders the table of down monitors with monitor name,
    last-down timestamp, ping, and error message visible
- [x] Auto-refresh works without full page reload (poll interval 30 s)
- [x] Search/filter narrows the visible list correctly (by name or error msg)
- [x] Project runs locally with documented `npm install` + `npm run dev`
- [x] README included with setup steps and required environment variables

## Environment variables

```dotenv
# server/.env.example — copy to server/.env and edit
DB_TYPE=mariadb          # or "sqlite"
DB_HOST=103.103.21.41    # required when DB_TYPE=mariadb|mysql
DB_PORT=3306             # required when DB_TYPE=mariadb|mysql
DB_NAME=kuma             # required when DB_TYPE=mariadb|mysql
DB_USER=uptimekuma       # required when DB_TYPE=mariadb|mysql
DB_PASS=<YOUR-DB-PASSWORD>  # required when DB_TYPE=mariadb|mysql

# SQLite alternative (no host/user/pass needed)
# DB_TYPE=sqlite
# DB_PATH=./data/kuma.db

# Optional — dev CORS origin
FRONTEND_ORIGIN=http://localhost:5173

# Server
PORT=4242
```

## Notes

- The SQL query is **identical** to the reference provided (no deviations).
- `up` / `down` in the DB schema are **smallint counts** (0–2), not booleans; the mapper coerces safely.
- The frontend uses **5-second cache** on the backend to amortise the 30-s polling interval.
- Error-badge colours (via Tailwind):
  - `ECONNREFUSED` → red-100
  - `EHOSTUNREACH` → orange-100
  - `ENOTFOUND` / DNS → purple-100
  - `TIMEOUT` → yellow-100
  - HTTP 5xx / 4xx → orange / amber variants
  - Unknown → slate-100

## Scripts

| Script                | What it does                              |
|-----------------------|-------------------------------------------|
| `npm install`         | Installs both `server/` and `frontend/` |
| `npm run dev:server`  | Starts Express via `tsx` on :4242       |
| `npm run dev`         | Starts Vite on :5173 (proxy to :4242)   |
| `npm run typecheck`   | Runs `tsc` on both sides                  |
| `npm run build`       | Frontend production build (vite build)    |