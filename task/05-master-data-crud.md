# Task 05: Master Data CRUD

## Deskripsi
Implementasi CRUD lengkap untuk semua master data: Section, Location, Shift, User, Asset, dan HSE Parameter, baik backend maupun frontend.

## Subtasks

### 5.1 Backend — CRUD Endpoints

Semua endpoint master data menggunakan pattern:
- `GET /api/v1/resources` → List (dengan pagination & filter)
- `GET /api/v1/resources/{id}` → Get By ID
- `POST /api/v1/resources` → Create (validasi input)
- `PUT /api/v1/resources/{id}` → Update
- `DELETE /api/v1/resources/{id}` → Soft delete (is_active = false)

**Resources:**
| Resource | Endpoint | Validasi Khusus |
|----------|----------|-----------------|
| Section | `/sections` | Nama unik |
| Location | `/locations` | Nama unik |
| Shift | `/shifts` | Start_time < end_time |
| User | `/users` | Email unik, password hash, valid role |
| Asset | `/assets` | Serial number unik, qr_code auto-generate, valid foreign key |
| HSE Parameter | `/parameters` | Order unik per kategori, valid input_type & check_type |
| Location | `/locations` | - |
| Section | `/sections` | - |

### 5.2 Backend — QR Code Auto Generate
- Saat create asset, sistem auto-generate UUID untuk `qr_code`
- Endpoint `GET /api/v1/assets/{id}/qr` → return PNG QR code
- Gunakan library boombuler/barcode

### 5.3 Frontend — Halaman CRUD

Buat halaman master data dinamis berdasarkan resource:
- **MasterDataPage** (`/:resource`): render table + form modal sesuai resource
- Form dinamis berdasarkan field entity (baca dari model)
- Reusable DataTable component: sorting, pagination, search
- Reusable FormModal component: create/edit dengan validasi Zod
- Konfirmasi dialog sebelum delete
- Status badge (active/inactive)

### 5.4 Frontend — Form Components
- `InputField`: text, email, number, date, password
- `SelectField`: dropdown dari enum/referensi
- `ToggleField`: boolean switch (untuk is_active, is_required)
- `FileUploadField`: upload foto dengan preview
- `TextareaField`: untuk description, notes

### 5.5 Import/Export Individual
- Button "Export CSV" per resource
- Button "Import CSV" dengan preview & validasi

## Acceptance Criteria
- [ ] CRUD Section, Location, Shift berfungsi penuh
- [ ] CRUD Asset dengan semua field + validasi foreign key
- [ ] CRUD User dengan validasi email unik + hashing password
- [ ] CRUD HSE Parameter dengan 4 tipe input
- [ ] Generate QR Code untuk setiap aset (PNG download)
- [ ] Soft delete (is_active = false), bukan hard delete
- [ ] Frontend: table loading, empty state, error state
- [ ] Form validasi client-side (Zod) + server-side (go-playground/validator)
- [ ] Pagination dan search filter di semua list page

## References
- `backend/internal/handler/master_data.go`
- `backend/internal/handler/asset.go`
- `backend/internal/service/asset.go` (GenerateQRCode)
- `frontend/src/pages/MasterDataPage.tsx`
- PRD FR-01: Manajemen Master Data
