# AGENTS.md

## Stack
- TypeScript strict di backend & frontend
- Backend: Express/Fastify (pilih salah satu, konsisten)
- Frontend: React + Vite + Tailwind CSS

## Database (Uptime Kuma)
- Schema: monitor, heartbeat, stat_minutely
- Koneksi via env var: DB_TYPE, DB_HOST/DB_PATH, dst — jangan hardcode kredensial
- Proyek ini READ-ONLY terhadap DB — jangan pernah ubah schema

## Aturan
- Jangan tambah dependency tanpa izin
- Jangan tambah fitur di luar yang diminta
- Stop & tanya sebelum: hapus file, ubah schema DB, install dependency baru
