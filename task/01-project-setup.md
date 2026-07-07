# Task 01: Project Setup & Docker Infrastructure

## Deskripsi
Setup awal proyek mencakup inisialisasi struktur monorepo, konfigurasi Docker Compose untuk semua service (MySQL, Redis, Backend, Frontend, Nginx), serta boilerplate kode untuk backend Golang dan frontend React.

## Subtasks

### 1.1 Struktur Direktori
- Buat monorepo dengan folder `backend/`, `frontend/`, `nginx/`, `task/`
- Backend: `cmd/server/`, `internal/`, `pkg/`, `migrations/`
- Frontend: `src/pages/`, `src/components/`, `src/lib/`, `src/types/`, `src/styles/`

### 1.2 Docker Compose
- Definisi service MySQL 8 (port 3307, volume persisten, healthcheck)
- Definisi service Redis 7 (port 6380, volume persist, healthcheck)
- Definisi service Backend (Golang, port 8080, env vars, depends_on)
- Definisi service Frontend (React/Vite, port 3000, depends_on backend)
- Definisi service Nginx (reverse proxy, port 80, static files + API routing)
- Volume: `mysql_data`, `redis_data`, `uploads`

### 1.3 Backend Boilerplate
- `go.mod` dengan dependencies: chi, sqlx, mysql driver, jwt, redis, asynq, viper, zerolog, excelize, casbin, dll
- `Dockerfile` multi-stage: builder (golang:1.22-alpine) → runner (alpine)
- `cmd/server/main.go`: load config, koneksi DB & Redis, init router, serve HTTP
- `internal/config/`: load env via viper, helper method MySQLDSN() & RedisAddr()
- `pkg/database/mysql.go`: sqlx connect + pool settings

### 1.4 Frontend Boilerplate
- `package.json` dengan dependencies: React 18, TanStack Query, Zustand, React Router, Axios, RHF + Zod, Recharts, Tailwind, shadcn/ui
- `vite.config.ts`: React plugin, PWA plugin, path alias `@/`, proxy `/api` → backend
- `tsconfig.json`: strict mode, path alias
- `tailwind.config.ts`: custom color palette (primary), content paths
- `postcss.config.js`
- `index.html`: meta theme-color, lang id
- `src/main.tsx`: QueryClient provider, render App
- `src/App.tsx`: BrowserRouter dengan route: `/login`, `/dashboard`, `/scan/:qrCode`, `/inspeksi-lapangan`, `/inspeksi-asset/:id`, `/export-hse`, `/:resource`
- `src/styles/globals.css`: Tailwind directives + CSS variables (shadcn/ui)
- `src/lib/utils.ts`: cn() helper, formatDate()
- `src/lib/axios.ts`: Axios instance baseURL `/api/v1`, interceptor untuk JWT access token + refresh token rotation
- `src/types/index.ts`: TypeScript interfaces untuk semua entity

### 1.5 Nginx
- `default.conf`: upstream backend + frontend, proxy `/api/` → backend, `/` → frontend, client_max_body_size 20MB

### 1.6 Makefile
- Target: `dev`, `build`, `up`, `down`, `logs`, `migrate`

### 1.7 Git
- `.gitignore`: backend build artifacts, node_modules, Docker volumes, IDE files
- `.env.example`: template environment variables

## Acceptance Criteria
- [ ] `docker compose up --build -d` berhasil tanpa error
- [ ] Backend server running di port 8080
- [ ] Frontend dev server running di port 3000 (atau via Nginx port 80)
- [ ] MySQL dan Redis healthcheck passing
- [ ] Nginx reverse proxy bekerja: `/api/v1/auth/login` → backend, `/` → frontend
- [ ] `go mod tidy` berhasil di backend

## References
- `docker-compose.yml`
- `backend/Dockerfile`, `frontend/Dockerfile`
- `backend/go.mod`
- `frontend/package.json`
- `nginx/default.conf`
- `Makefile`
