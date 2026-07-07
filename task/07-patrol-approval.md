# Task 07: Patrol Submission & Approval Workflow

## Deskripsi
Implementasi alur submit patroli oleh petugas K3L dan approval workflow oleh Tim HSE dengan state machine: draft → submitted → waiting_approval → approved/rejected.

## Subtasks

### 7.1 Backend — Patrol Service

**Create Patrol** (`POST /api/v1/patrols`):
- Terima data: asset_id, shift_id, client_uuid, details[], attachments[]
- Validasi client_uuid: cek duplikasi di database
- Insert ke tabel patrols (status = draft)
- Batch insert patrol_details
- Per attachment: insert ke patrol_attachments
- Jika ada anomali di details: create alert ke PIC aset

**Submit Patrol** (`PUT /api/v1/patrols/{id}/submit`):
- Ubah status dari draft → waiting_approval
- Set submitted_at = now
- Trigger notifikasi ke Tim HSE

**Approve Patrol** (`PUT /api/v1/patrols/{id}/approve`):
- Hanya role TIM_HSE dan SUPER_ADMIN
- Ubah status → approved
- Set approved_by = user_id, approved_at = now
- Notifikasi ke petugas pengaju

**Reject Patrol** (`PUT /api/v1/patrols/{id}/reject`):
- Hanya role TIM_HSE dan SUPER_ADMIN
- Ubah status → rejected
- Set rejection_reason (wajib diisi)
- Notifikasi ke petugas pengaju dengan alasan

**Ghost Edit** (`PUT /api/v1/patrols/{id}/ghost-edit`):
- Hanya role SUPER_ADMIN
- Edit nilai patrol_details tanpa mengubah histori approval
- Catat di activity_logs dengan is_ghost = true

### 7.2 Backend — List Filtering
**`GET /api/v1/patrols`**:
- Filter: status, user_id (untuk K3L lihat punya sendiri), asset_id, date range
- Pagination: offset, limit
- Include relasi: user, asset, shift, details, attachments

### 7.3 Frontend — Patrol List Page
- Table daftar patroli dengan filter:
  - Status (dropdown: all, waiting_approval, approved, rejected)
  - Date range (date picker)
  - Asset search
- Setiap row: status badge (color-coded), nama asset, petugas, tanggal submit
- Click row → detail modal

### 7.4 Frontend — Approval Page (Tim HSE)
- List patroli dengan status waiting_approval (prioritas tinggi)
- Detail modal: parameter values, foto attachments
- Tombol Approve (hijau) → konfirmasi dialog → success toast
- Tombol Reject (merah) → modal isi alasan → required → submit
- Loading & error state untuk setiap action

### 7.5 Frontend — Status Badge Component
- `approved` → hijau
- `rejected` → merah
- `waiting_approval` → kuning
- `draft` → abu-abu
- `submitted` → biru

### 7.6 State Machine Validasi
- draft → submitted (oleh petugas)
- submitted → waiting_approval (auto setelah submit)
- waiting_approval → approved (oleh HSE)
- waiting_approval → rejected (oleh HSE)
- Tidak ada transisi lain yang valid

## Acceptance Criteria
- [ ] Petugas submit patroli → status waiting_approval
- [ ] Tim HSE approve → status approved, tercatat approver
- [ ] Tim HSE reject → status rejected, alasan wajib diisi
- [ ] Ghost edit oleh Super Admin tercatat terpisah
- [ ] Duplikasi submit terdeteksi (client_uuid)
- [ ] Filter list patroli berfungsi (status, date, user)
- [ ] Frontend: status color-coded, confirmation dialog, toast notification
- [ ] Hanya petugas yang bisa lihat patroli sendiri (kecuali Super Admin & HSE)

## References
- `backend/internal/service/patrol.go`
- `backend/internal/handler/patrol.go`
- PRD FR-04: Submission & Approval
- PRD Section 9.2: State Machine Status Patroli
