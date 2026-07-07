# Task 10: Notifications & Activity Log

## Deskripsi
Implementasi sistem notifikasi database untuk anomali, aset expired, dan status approval, serta activity log untuk audit trail.

## Subtasks

### 10.1 Backend — Alert Service

**Anomaly Alert:**
- Trigger: saat patrol detail memiliki `is_anomaly = true`
- Insert ke tabel alerts dengan message deskriptif
- Target: PIC aset (asset.pic_id)
- Message format: "Anomali [parameter] pada [asset] — Nilai: [value]"

**Expired Asset Alert (Cron Job):**
- Cron job harian menggunakan Asynq scheduler
- Query aset dengan expired_at dalam 7 hari ke depan
- Buat alert untuk PIC aset
- H-7, H-3, H-1 reminder

**Approval Notification:**
- Trigger: saat patrol di-approve/di-reject
- Notifikasi ke petugas pengaju (patrol.user_id)
- Approved: "Patroli [asset] pada [date] telah disetujui oleh [approver]"
- Rejected: "Patroli [asset] pada [date] ditolak. Alasan: [rejection_reason]"

### 10.2 Backend — Alert Endpoints
- `GET /api/v1/alerts` → list alert untuk user yang login (filter: is_read)
- `PUT /api/v1/alerts/{id}/read` → mark as read
- `GET /api/v1/alerts/unread-count` → badge count untuk navbar

### 10.3 Backend — Activity Log Service
- Auto-logging untuk setiap operasi CRUD penting:
  - Create/Update/Delete master data
  - Submit/Approve/Reject patroli
  - Ghost edit
- Log entry: user_id, action, entity, entity_id, old_value, new_value, is_ghost

### 10.4 Frontend — Notification Center
- Bell icon di navbar dengan badge unread count
- Dropdown panel: 5 notifikasi terbaru
- Click notifikasi → mark as read + navigasi ke konteks
- "Lihat Semua" → halaman notifikasi lengkap
- Empty state: "Tidak ada notifikasi"

### 10.5 Frontend — Notification Badge
- Polling setiap 30 detik: `GET /api/v1/alerts/unread-count`
- WebSocket opsional untuk real-time push (future enhancement)
- Badge merah dengan angka di bell icon

### 10.6 Frontend — Toast Notifications
- Toast untuk feedback action:
  - Submit berhasil → toast hijau
  - Approve/reject → toast sukses
  - Error → toast merah
  - Auto dismiss 5 detik

## Acceptance Criteria
- [ ] Anomali menghasilkan alert ke PIC aset
- [ ] User menerima notifikasi di bell icon
- [ ] Badge unread count akurat
- [ ] Mark as read berfungsi (single & bulk)
- [ ] Notifikasi aset expired: H-7, H-3, H-1
- [ ] Activity log mencatat semua perubahan penting
- [ ] Ghost edit tercatat secara terpisah
- [ ] Toast notification untuk feedback action

## References
- `backend/internal/service/alert.go`
- PRD FR-07: Notifikasi
- PRD FR-08: Activity Log
