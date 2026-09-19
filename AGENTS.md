# AGENTS.md

## Stack
- TypeScript strict di backend & frontend
- Backend: Express 5 + TypeScript (Node.js)
- Frontend: React 19 + Vite 6 + TypeScript + Tailwind CSS 4

## Database (Uptime Kuma)
- Schema: monitor, heartbeat, stat_minutely
- Koneksi via env var: DB_TYPE, DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASS (mariadb/mysql) atau DB_PATH (sqlite)
- Proyek ini READ-ONLY terhadap DB — jangan pernah ubah schema
- Kredensial DB **jangan pernah** dihardcode ke dalam image

## Containerization (Docker)
### Arsitektur: Full-Stack (Frontend + Backend)
Proyek ini dipaketkan sebagai dua service dalam satu `docker-compose.yml`:

1. **frontend** — Vite + React dibangun melalui multi-stage build:
   - Stage build: `node:22-alpine` (ikuti `engines.node` dari `frontend/package.json`)
   - Hasil: folder `dist/` di-stage build
   - Stage runtime: `nginx:alpine` yang serve file statis dari stage build
   - `nginx.conf` mendukung client-side routing (fallback ke `index.html`)
   - `nginx` juga reverse-proxy `/api` ke service `backend` (port 4242)

2. **backend** — Express API dibangun melalui `node:22-alpine`:
   - Mengikuti `engines.node` dari `server/package.json` (`>=22.14.0`)
   - Environment variables diunggah dari `server/.env.example` (bukan dihardcode)
   - Health endpoint: `GET /health`
   - Service mendengarkan pada port 4242

### Dockerfile Frontend (multi-stage)
- Build stage: `node:22-alpine` → `npm ci` → `vite build` → hasil `dist/`
- Runtime stage: `nginx:alpine` → copy `dist/` dari build stage → konfig nginx dengan fallback routing + reverse proxy ke backend
- Container berjalan sebagai user non-root (101:101)
- Health check via `wget -qO- http://localhost:80/`
- Konfigurasi nginx.conf:
  - listen 80
  - listen [::]:80
  - root /usr/share/nginx/html
  - index index.html
  - `location /api { proxy_pass http://backend:4242; }` — reverse proxy ke backend
  - `location / { try_files $uri $uri/ /index.html; }` — client-side routing fallback

### Dockerfile Backend (single-stage)
- Base image: `node:22-alpine`
- `WORKDIR /app`
- Copy `package.json` + `package-lock.json` first → `npm ci --omit=dev` → cache-friendly
- Copy source code `src/` → build TypeScript ke `dist/` → hapus `src/`
- RUN sebagai user non-root (101:101)
- Expose port 4242
- Health check via `wget -qO- http://localhost:4242/health`

### docker-compose.yml
- Dua service: `frontend` (nginx:alpine, port 80) + `backend` (node:22-alpine, port 4 konsisten: 4242)
- Port mapping eksplisit: `8080:80` untuk frontend (host:container), `4242:4242` bebas disesuaikan kebutuhan
- Jaringan internal Docker untuk komunikasi antar service (frontend reverse proxy ke backend via `backend:4242`)
- Restart policy "unless-stopped" untuk keduanya
- Environment variables disuntik ke service backend dari file `.env` (compose auto-load `.env` dari root)
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
- Backend membaca dari `server/.env` di runtime, injected via compose `environment:`

## Frontend (Dark Mode)
- Dark mode berbasis class `.dark` di `<html>`, bukan `prefers-color-scheme` murni.
- `frontend/src/index.css` wajib memuat `@custom-variant dark (&:where(.dark, .dark *));` agar varian `dark:` mengikuti class `.dark` (default Tailwind v4 mengikuti media query sistem dan mengabaikan toggle manual).
- Urutan resolusi tema saat load via inline script di `frontend/index.html` (anti-FOUC): `localStorage.theme` → `prefers-color-scheme` → light. Script inline minimal, tanpa dependency.
- Toggle di header (`App.tsx`): ikon moon/sun dengan `aria-label`, simpan pilihan ke `localStorage.theme`, ikuti perubahan sistem (`matchMedia` listener) hanya bila user belum memilih manual.
- Setiap class warna/background/border/placeholder WAJIB punya pasangan `dark:` — tidak ada elemen yang hanya terang.
- Badge status (`frontend/src/lib/errors.ts`): tiap `badgeClass` wajib punya pasangan gelap `bg-<warna>-900/30 text-<warna>-300 border-<warna>-800`.
- Validasi: `cd frontend && npx tsc -p tsconfig.app.json --noEmit && npx vite build` harus lolos.

## Aturan (ditingkatkan)
- Jangan tambah dependency tanpa izin
- Jangan service di luar yang diminta (termasuk database)
- Jangan tambah fitur di luar yang diminta
- Stop & tanya sebelum: hapus file, ubah schema DB, install dependency new, install dependency baru, docker push ke registry mana pun, atau commit/push ke git
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
