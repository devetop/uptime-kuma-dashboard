# AGENTS.md

## Stack
- TypeScript strict di backend & frontend
- Backend: Express 5 + TypeScript (Node.js)
- Frontend: React 19 + Vite 6 + TypeScript + Tailwind CSS 4
- Tipe domain bersama: `shared/index.ts` (satu-satunya sumber kebenaran)

## Database (Uptime Kuma)
- Schema: monitor, heartbeat, stat_minutely
- Koneksi via env var: DB_TYPE, DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASS (mariadb/mysql) atau DB_PATH (sqlite)
- Proyek ini READ-ONLY terhadap DB — jangan pernah ubah schema
- Kredensial DB **jangan pernah** dihardcode ke dalam image

## Kontrak API & Tipe Bersama
- Semua tipe domain (`DownMonitor`, `QuickStats`, `DownMonitorsResponse`) ada di `shared/index.ts`; server dan frontend mengimpornya via `@shared/index.ts`. Jangan menduplikasi bentuk response.
- `GET /api/down-monitors` mengembalikan `{ total, data, stats }`; `total` = panjang `data`, `stats` = agregat cepat per status monitor.
- `QuickStats` (`up`, `down`, `pending`, `maintenance`, `unknown`, `pause`, `active`) dihitung `QUICK_STATS_SQL` di `server/src/lib/sql.ts`: status heartbeat `1=up, 0=down, 2=pending, 3=maintenance`, selain itu `unknown`; `active` dipropagasi dari parent ke child lewat recursive CTE (child non-aktif bila parent non-aktif).
- `QUICK_STATS_SQL` dan `DOWN_MONITORS_SQL` harus portabel untuk MySQL/MariaDB dan SQLite karena kedua bridge memakainya. `query-quick-statistic.sql` di root hanya referensi dialek MySQL, bukan query yang dijalankan server.
- Nilai mentah DB dinormalisasi di `server/src/lib/mappers.ts` (`Number(...)`, fallback `0`/`""`/`null`); jangan casting mentah ke tipe domain.
- Response di-cache **5 detik**; bila loader gagal, sajikan cache lama, error 500 hanya jika cache kosong. Kedua bridge wajib mengembalikan `LoadedData = { monitors, stats }`.
- Field baru pada response wajib ditambahkan di tiga tempat: `shared/index.ts`, guard `isDownMonitorsResponse` (`frontend/src/lib/api.ts`), dan `frontend/src/lib/api.test.ts`.

## Konvensi Frontend (State & Validasi)
- Trust boundary: response `fetch` divalidasi runtime (`isRecord`, `isValidStats`, `isDownMonitorsResponse`) sebelum masuk React. Jangan `as` hasil `res.json()`.
- ID monitor memakai brand `MonitorId` (`frontend/src/lib/types.ts`); konversi hanya di `toMonitorView` setelah validasi.
- State UI memakai discriminated union (`Result`, `LiveSlot`, `CountState`), bukan kombinasi boolean flag.
- Self-check tanpa framework: `node --experimental-strip-types frontend/src/lib/api.test.ts` (assert manual, tanpa `node:assert` karena tsconfig frontend tidak memuat tipe Node).
- Filter state dikelola hook `useFilters` (`frontend/src/hooks/useFilters.ts`); perubahan logika filter wajib lulus `node --experimental-strip-types frontend/src/hooks/useFilters.test.ts`.
- Ikon custom di `frontend/src/components/icons.tsx`; hapus ikon yang tidak terpakai bersama pemakainya (jangan sisakan ekspor mati).

## Containerization (Docker)
### Arsitektur: Full-Stack (Frontend + Backend)
Proyek ini dipaketkan sebagai dua service dalam satu `docker-compose.yml`:

1. **frontend** — Vite + React dibangun melalui multi-stage build:
   - Stage build: `node:22-alpine` (`engines.node` frontend = `>=20.6.0`)
   - Hasil: folder `dist/` di-stage build
   - Stage runtime: `nginx:alpine` yang serve file statis dari stage build
   - `nginx.conf` mendukung client-side routing (fallback ke `index.html`)
   - `nginx` juga reverse-proxy `/api` ke service `backend` (port 4242)

2. **backend** — Express API dibangun melalui `node:22-alpine`:
   - Mengikuti `engines.node` dari `server/package.json` (`>=22.14.0`)
   - Environment variables dari `server/.env` via compose `env_file:` (bukan dihardcode)
   - Health endpoint: `GET /api/health`
   - Service mendengarkan pada port 4242

### Dockerfile Frontend (multi-stage)
- Build stage: `node:22-alpine` → `npm ci` → `npm run build` (`tsc -p tsconfig.app.json && vite build`) → hasil `dist/`
- Runtime stage: `nginx:alpine` → copy `dist/` dari build stage → konfig nginx dengan fallback routing + reverse proxy ke backend
- Container berjalan sebagai user non-root (101:101)
- Health check via `wget -qO- http://localhost:80/`
- Konfigurasi nginx.conf:
  - listen 80
  - listen [::]:80
  - root /usr/share/nginx/html
  - index index.html
  - `location /api` → reverse proxy ke `backend:4242` (resolver Docker, di-resolve saat request)
  - `location /assets/` → cache immutable untuk aset ber-hash Vite
  - `location / { try_files $uri $uri/ /index.html; }` — client-side routing fallback

### Dockerfile Backend (multi-stage)
- Build stage: `node:22-alpine` → `npm ci --include=dev` → `npm run build` (`tsc -p tsconfig.build.json`) → hasil `dist/server/src/`
- Runtime stage: `node:22-alpine` → `npm ci --omit=dev` → copy `dist/` dari build stage (source `src/` tidak ikut)
- Build context = root repo; `tsconfig.build.json` (`rootDir: "../"`) mereferensikan `../shared`
- RUN sebagai user non-root (101:101)
- Expose port 4242
- Health check via `wget -qO- "http://127.0.0.1:${PORT:-4242}/api/health"`

### docker-compose.yml
- Dua service: `frontend` (nginx:alpine, port 80) + `backend` (node:22-alpine, port 4242)
- Build context = root repo untuk kedua service
- Port mapping frontend: `${FRONTEND_PORT:-8080}:80` (host:container); port backend 4242 tidak dipublish (hanya internal; mapping `ports` dikomentari untuk debug)
- Jaringan internal Docker `monitoring-dashboard-network` untuk komunikasi antar service (frontend reverse proxy ke backend via `backend:4242`)
- Restart policy "unless-stopped" untuk keduanya; `frontend` `depends_on` `backend` (`condition: service_healthy`)
- `frontend` butuh `sysctl net.ipv4.ip_unprivileged_port_start=80` agar uid 101 bisa bind port 80
- Environment backend: DB dari `env_file: ./server/.env`; `NODE_ENV`, `PORT`, `FRONTEND_ORIGIN` dari blok `environment:`
- Jangan sertakan service database di compose ini — DB Uptime Kuma bersifat eksternal dan read-only

### .dockerignore (di root repo)
- `node_modules`
- `.git`
- `dist` (folder build hasil)
- File env lokal (`.env`, `.env.*`, tapi **jangan** exclude `.env.example` yang penting untuk referensi)
- `*.local`

## Environment Variables
- Semua environment variables mengikuti `.env.example` di masing-masing paket
- **Jangan pernah** hardcode kredensial DB (DB_TYPE, DB_HOST, DB_NAME, DB_USER, DB_PASS) ke dalam image
- Frontend `API_BASE = '/api'` adalah relatif — tidak butuh `VITE_*` env var
- Backend membaca `server/.env` via compose `env_file:`; `PORT`/`FRONTEND_ORIGIN`/`NODE_ENV` di-set di blok `environment:`

## Frontend (Dark Mode)
- Dark mode berbasis class `.dark` di `<html>`, bukan `prefers-color-scheme` murni.
- `frontend/src/index.css` wajib memuat `@custom-variant dark (&:where(.dark, .dark *));` agar varian `dark:` mengikuti class `.dark` (default Tailwind v4 mengikuti media query sistem dan mengabaikan toggle manual).
- Urutan resolusi tema saat load via inline script di `frontend/index.html` (anti-FOUC): `localStorage.theme` → `prefers-color-scheme` → light. Script inline minimal, tanpa dependency.
- Toggle di `frontend/src/components/Header.tsx` (state: `frontend/src/hooks/useTheme.ts`): ikon moon/sun dengan `aria-label`, simpan pilihan ke `localStorage.theme`, ikuti perubahan sistem (`matchMedia` listener) hanya bila user belum memilih manual.
- Setiap class warna/background/border/placeholder WAJIB punya pasangan `dark:` — tidak ada elemen yang hanya terang.
- Badge status (`frontend/src/lib/errors.ts`): tiap `badgeClass` wajib punya pasangan gelap `bg-<warna>-900/30 text-<warna>-300 border-<warna>-500`.
- Validasi: `cd frontend && npx tsc -p tsconfig.app.json --noEmit && npx vite build` harus lolos; bila menyentuh `api.ts`/tipe response, jalankan juga `node --experimental-strip-types frontend/src/lib/api.test.ts`.

## Aturan (ditingkatkan)
- Jangan tambah dependency tanpa izin
- Jangan service di luar yang diminta (termasuk database)
- Jangan tambah fitur di luar yang diminta
- Stop & tanya sebelum: hapus file, ubah schema DB, install dependency baru, docker push ke registry mana pun, atau commit/push ke git
- Image harus dibangun dengan `docker compose build` atau `docker compose up --build`
- Jalankan `docker compose up` untuk menjalankan keduanya sekaligus
- Firewall / isolation: jalankan container sebagai user non-root
- Scan vulnerability teratur dengan `docker scout` atau `docker buildx imagetools inspect`
- Base image selalu diupdate untuk memperbaiki CVE

## Menjalankan Proyek
Dari root repo:
```bash
# 1. Build & jalankan keduanya (frontend + backend)
docker compose up --build
```
Setelah pertama kali berjalan, akses di: `http://localhost:8080`

```bash
# 2. Hentikan keduanya
docker compose down
```

```bash
Dalam mode development, jalankan (dua terminal):
npm run dev:server      # starts Express on http://localhost:4242
npm run dev:frontend    # starts Vite on http://   localhost:5173
# (Opsional) npm run dev:frontend untuk menyediakan proxy /api → localhost:4242
```

## Struktur File Container
Setiap paket harus memiliki file berikut:
- `Dockerfile` — definisi build dan runtime (frontend dan backend masing-masing punya)
- `docker-compose.yml` — orkestrasi keduanya (di root)
- `.dockerignore` — mengurangi layer image (di root)
- `nginx.conf` — hanya di `frontend/` untuk runtime nginx
- `server/.env.example` — variabel environment untuk backend (sudah ada)
- `frontend/.env.example` — dibuat kosong atau disalin dari root karena `API_BASE` relatif

## Image Size Target
- Frontend ≤ 50MB (nginx:alpine + dist)
- Backend ≤ 150MB (node:alpine + production deps)