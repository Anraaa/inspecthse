# InspectHSE

Sistem Manajemen Inspeksi K3L (Keselamatan, Kesehatan Kerja, dan Lingkungan) berbasis web untuk PT. INSPECT HSE.

## Fitur

- **QR Scan & Inspeksi** — Scan QR aset, isi form inspeksi langsung dari HP/tablet
- **Manajemen Aset** — CRUD master data aset (APAR, Hydrant, Fire Alarm), lokasi, section, shift, parameter HSE
- **Patrol & Approval** — Submit patrol, workflow approval (Tim HSE), ghost edit (Super Admin)
- **Dashboard** — Statistik real-time per role (Super Admin, K3L, Tim HSE)
- **Export & Import** — Export checksheet Excel tahunan, import master data aset via Excel dengan template
- **Notifikasi** — Alert anomali, approval, aset expired (bell icon, notifikasi terpusat)
- **Activity Log** — Audit trail semua perubahan data
- **RBAC** — Role-based access: Super Admin, K3L, Tim HSE
- **PWA** — Progressive Web App, bisa di-install ke home screen
- **Dark Mode** — Toggle light/dark theme
- **Pagination** — Navigasi data tabel yang responsif

## Tech Stack

### Backend
- Go 1.24 + Chi router
- MySQL 8.0
- Redis 7 (JWT refresh token)
- JWT (access + refresh token)
- excelize (Excel export/import)

### Frontend
- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- Zustand (state management)
- TanStack Query (server state)
- React Router v6
- Axios
- Lucide React (icons)
- Recharts (dashboard charts)
- sonner (toast notifications)
- Vite PWA

## Prerequisites

- Go 1.24+
- Node.js 20+
- MySQL 8.0
- Redis 7

## Setup

### 1. Clone & masuk direktori

```bash
git clone https://github.com/Anraaa/inspecthse.git
cd inspecthse
```

### 2. Backend

```bash
cd backend

# Copy env
cp .env.example .env
# Edit .env sesuai environment

# Jalankan database & redis
cd ..
docker compose up -d

# Migrate & seed
cd backend
go run ./cmd/server -migrate -seed

# Run server
go run ./cmd/server
```

Backend berjalan di `http://localhost:8080`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:3000`.

### 4. Login

Default seeder:

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@inspecthse.com | admin123 |
| K3L | k3l@inspecthse.com | k3l123 |
| Tim HSE | timhse@inspecthse.com | timhse123 |

## Docker (Production)

```bash
docker compose -f docker-compose.prod.yml up -d
```

Pastikan file `.env` sudah berisi konfigurasi production.

## Project Structure

```
inspecthse/
├── backend/
│   ├── cmd/server/          # Entry point
│   ├── internal/
│   │   ├── config/          # Konfigurasi aplikasi
│   │   ├── handler/         # HTTP handlers
│   │   ├── middleware/      # Auth & RBAC middleware
│   │   ├── model/           # Domain models
│   │   ├── repository/      # Database layer (MySQL)
│   │   ├── router/          # Chi router
│   │   └── service/         # Business logic
│   ├── migrations/          # SQL migrations
│   ├── pkg/database/        # DB connection & migrate
│   └── pkg/seeder/          # Data seeder
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── lib/             # Utilities, API, theme
│   │   ├── pages/           # Page components
│   │   ├── store/           # Zustand stores
│   │   ├── styles/          # Global CSS
│   │   ├── test/            # Unit tests
│   │   └── types/           # TypeScript types
│   └── e2e/                 # Playwright E2E tests
├── docker-compose.yml       # Dev database
├── docker-compose.prod.yml  # Production stack
└── .github/workflows/       # CI pipeline
```

## API

Base URL: `/api/v1`

### Auth
| Method | Path | Description |
|---|---|---|
| POST | /auth/login | Login |
| POST | /auth/refresh | Refresh token |
| POST | /auth/logout | Logout |

### Dashboard
| Method | Path | Role |
|---|---|---|
| GET | /dashboard/super-admin | Super Admin |
| GET | /dashboard/k3l | K3L |
| GET | /dashboard/tim-hse | Tim HSE |

### Master Data
| Method | Path | Description |
|---|---|---|
| GET/POST | /locations | List / Create |
| GET/PUT/DELETE | /locations/{id} | Get / Update / Delete |
| GET/POST | /sections | List / Create |
| GET/POST | /shifts | List / Create |
| GET/POST | /parameters | List / Create |
| GET/POST | /users | List / Create (Super Admin) |

### Assets
| Method | Path | Description |
|---|---|---|
| GET/POST | /assets | List / Create |
| GET/PUT/DELETE | /assets/{id} | Get / Update / Delete |
| GET | /assets/{id}/qr | Generate QR Code |
| GET | /scan/{qrCode} | Get asset by QR |

### Patrol
| Method | Path | Description |
|---|---|---|
| POST | /patrols | Submit patrol |
| GET | /patrols | List patrols |
| GET | /patrols/{id} | Get patrol detail |
| PUT | /patrols/{id}/approve | Approve (Tim HSE) |
| PUT | /patrols/{id}/reject | Reject (Tim HSE) |
| PUT | /patrols/{id}/ghost-edit | Ghost edit (Super Admin) |

### Export & Import
| Method | Path | Description |
|---|---|---|
| GET | /export/checksheet | Export checksheet Excel |
| GET | /import/template | Download template import |
| POST | /import/assets | Import assets from Excel |

### Alerts
| Method | Path | Description |
|---|---|---|
| GET | /alerts | List alerts |
| GET | /alerts/unread-count | Unread count |
| PUT | /alerts/read-all | Mark all as read |
| PUT | /alerts/{id}/read | Mark one as read |

## CI

GitHub Actions otomatis menjalankan:

- **backend-lint** — golangci-lint
- **backend-test** — go test (dengan MySQL + Redis)
- **backend-build** — go build
- **frontend-lint** — ESLint + TypeScript check
- **frontend-test** — Vitest
- **frontend-build** — Vite build

## License

MIT
