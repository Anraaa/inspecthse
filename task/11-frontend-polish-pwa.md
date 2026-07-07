# Task 11: Frontend Polish & PWA

## Deskripsi
Finalisasi frontend: UI polish, PWA setup, optimasi performa, error handling, dan testing.

## Subtasks

### 11.1 PWA Setup
- `vite-plugin-pwa` konfigurasi: manifest.json, service worker, cache strategy
- Ikon: 192x192, 512x512
- Theme color: #1e40af (primary-800)
- Offline fallback page
- Cache API responses (stale-while-revalidate)
- Install prompt handler

### 11.2 UI Polish
- Loading skeleton untuk semua halaman
- Empty state illustrations
- Error boundary component
- Toast notification system (sonner atau react-hot-toast)
- Responsive design: mobile (320px) → tablet (768px) → desktop (1280px)
- Dark mode toggle (menggunakan class strategy + localStorage)
- Animation: page transition (framer-motion), hover states, micro-interactions
- Consistent spacing, typography, color system

### 11.3 Error Handling
- Global error boundary (React Error Boundary)
- Network error handling: retry button, offline indicator
- Form error: inline validation messages
- 404 page
- 403 forbidden page
- Server error (500) → friendly message + retry

### 11.4 Performance Optimization
- Code splitting: React.lazy() per page
- Image optimization: lazy loading, WebP format
- Debounce search input
- Virtual scroll untuk table dengan data besar (> 1000 rows)
- Bundle analysis (vite-plugin-inspect)

### 11.5 Component Testing (Vitest)
- Unit test untuk utility functions
- Component test untuk: Button, Input, Modal, Table, Badge, Chart
- API mock menggunakan MSW (Mock Service Worker)
- Test coverage report

### 11.6 E2E Testing (Playwright)
- Test flow: Login → Dashboard → CRUD Asset → Scan QR → Submit Patrol → Approve
- Test per role: SUPER_ADMIN, K3L, TIM_HSE
- Test responsive layout
- Test offline behavior (PWA)

## Acceptance Criteria
- [ ] PWA: installable, service worker, offline fallback
- [ ] Loading skeleton di semua halaman
- [ ] Toast notification untuk feedback
- [ ] Responsive: mobile, tablet, desktop
- [ ] Error boundary menangkap error component
- [ ] Code splitting berfungsi (lazy loading)
- [ ] UI test coverage > 70%
- [ ] E2E test untuk flow utama
- [ ] Bundle size < 200KB (initial load)

## References
- `frontend/vite.config.ts` (PWA plugin)
- `frontend/src/main.tsx` (Error Boundary wrapper)
- `frontend/src/App.tsx` (lazy routes)
- PRD Section 11: UI/UX Guidelines
