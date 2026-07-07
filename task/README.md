# Task List — InspectHSE

Daftar task pengembangan InspectHSE dari awal hingga akhir, diurutkan berdasarkan fase pengerjaan.

| # | Task | Fase | Prioritas | Status |
|---|------|------|-----------|--------|
| 1 | [Project Setup & Docker Infrastructure](01-project-setup.md) | Fase 1 | P0 | ✅ |
| 2 | [Database Schema & Migration](02-database-schema.md) | Fase 2 | P0 | ⬜ |
| 3 | [Repository Layer Implementation](03-repository-layer.md) | Fase 2 | P0 | ⬜ |
| 4 | [Auth & RBAC](04-auth-rbac.md) | Fase 3 | P0 | ⬜ |
| 5 | [Master Data CRUD](05-master-data-crud.md) | Fase 4 | P0 | ⬜ |
| 6 | [QR Scan & Dynamic Inspection Form](06-qr-scan-inspection-form.md) | Fase 5 | P0 | ⬜ |
| 7 | [Patrol Submission & Approval Workflow](07-patrol-approval.md) | Fase 6 | P0 | ⬜ |
| 8 | [Dashboard & Charts per Role](08-dashboard.md) | Fase 7 | P0 | ⬜ |
| 9 | [Export Checksheet & Import Assets](09-export-import.md) | Fase 8 | P0 | ✅ |
| 10 | [Notifications & Activity Log](10-notifications.md) | Fase 6 | P1 | ⬜ |
| 11 | [Frontend Polish & PWA](11-frontend-polish-pwa.md) | Fase 9 | P1 | ⬜ |
| 12 | [CI/CD & Deployment](12-ci-cd-deployment.md) | Fase 1/9 | P0 | ⬜ |

## Fase Pengerjaan

| Fase | Deskripsi | Task |
|------|-----------|------|
| **Fase 1** | Setup project, boilerplate, CI/CD, Docker | 1, 12 |
| **Fase 2** | Database schema, seeder, repository layer | 2, 3 |
| **Fase 3** | Auth & RBAC (login, JWT, register, middleware) | 4 |
| **Fase 4** | CRUD master data — backend + frontend | 5 |
| **Fase 5** | QR Code generate & scan, form inspeksi dinamis | 6 |
| **Fase 6** | Submit patroli, approval workflow, notifikasi | 7, 10 |
| **Fase 7** | Dashboard & grafik per role | 8 |
| **Fase 8** | Export checksheet + import aset Excel | 9 |
| **Fase 9** | PWA, optimasi, UAT, bug fixing, deployment | 11, 12 |

## Priority Definitions

- **P0**: Critical — harus selesai untuk MVP
- **P1**: Important — fitur utama tapi bisa menyusul
- **P2**: Nice to have — enhancement setelah MVP

> **Catatan**: Semua task bersifat iteratif. Frontend dikerjakan paralel dengan backend setelah API contract (interface) selesai.
