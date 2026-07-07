# Task 04: Auth & RBAC

## Deskripsi
Implementasi autentikasi JWT (access + refresh token) dan Role-Based Access Control (RBAC) untuk membatasi akses berdasarkan role user.

## Subtasks

### 4.1 Backend — Auth Service
**Login** (`POST /api/v1/auth/login`):
- Validasi email & password dari request body
- Query user by email → compare password hash (bcrypt)
- Generate JWT access token (15 menit) dengan claims: user_id, email, role, exp, iat
- Generate JWT refresh token (7 hari) dengan claims yang sama
- Simpan refresh token di Redis: `refresh:{token} → user_id` dengan TTL 7 hari
- Return access_token + refresh_token

**Refresh Token** (`POST /api/v1/auth/refresh`):
- Validasi refresh token dari body
- Cek Redis: `refresh:{token}` → dapatkan user_id
- Hapus token lama (refresh token rotation untuk keamanan)
- Generate access + refresh token baru
- Simpan refresh token baru di Redis
- Return token baru

**Logout** (`POST /api/v1/auth/logout`):
- Hapus refresh token dari Redis

### 4.2 Backend — Auth Middleware
- Parse Bearer token dari Authorization header
- Validasi JWT signature & expiry
- Inject user_id, role ke context (r.Context())
- Return 401 jika token invalid/expired

### 4.3 Backend — RBAC Middleware
- Middleware yang menerima variadic parameter allowed roles
- Cek role dari context
- Return 403 jika role tidak sesuai

### 4.4 Route Protection
| Route | Middleware | Role yang Diizinkan |
|-------|-----------|-------------------|
| `/auth/login`, `/auth/refresh` | Public | - |
| `/auth/logout` | Auth | Semua |
| `/dashboard/*` | Auth + RBAC | SUPER_ADMIN, K3L, TIM_HSE |
| `/assets/*` | Auth + RBAC | SUPER_ADMIN |
| `/users/*` | Auth + RBAC | SUPER_ADMIN |
| `/patrols` (POST) | Auth | K3L |
| `/patrols/{id}/approve` | Auth + RBAC | TIM_HSE, SUPER_ADMIN |
| `/export/*` | Auth + RBAC | SUPER_ADMIN |

### 4.5 Frontend — Auth Context & Hooks
- AuthStore (Zustand): user data, isAuthenticated, login(), logout(), refresh()
- Axios interceptor: attach Bearer token, handle 401 → refresh token → retry
- ProtectedRoute component: redirect ke `/login` jika tidak authenticated
- RoleGuard component: render children hanya jika role sesuai

### 4.6 Frontend — Login Page
- Form email + password dengan validasi Zod
- Loading state saat submit
- Error message handling
- Redirect ke `/dashboard` setelah login sukses
- Simpan access_token + refresh_token di localStorage

## Acceptance Criteria
- [ ] Login dengan email + password valid → mendapat access + refresh token
- [ ] Login dengan invalid credentials → 401 error
- [ ] Access token expired → 401, refresh token → dapat token baru
- [ ] Refresh token reuse → deteksi dan invalidate
- [ ] User K3L tidak bisa akses route /users
- [ ] User tanpa token → redirect ke /login
- [ ] Refresh token rotation: token lama tidak bisa dipakai lagi
- [ ] Logout → token dihapus dari Redis

## References
- `backend/internal/service/auth.go`
- `backend/internal/middleware/auth.go`
- `backend/internal/handler/auth.go`
- `frontend/src/lib/axios.ts`
- `frontend/src/pages/LoginPage.tsx`
- PRD FR-03 (Auth), NFR-03 & NFR-04 (Security)
