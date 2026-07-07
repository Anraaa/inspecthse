# Task 02: Database Schema & Migration

## Deskripsi
Membuat migration SQL untuk seluruh tabel sesuai entity relationship di PRD, serta seeder data awal untuk development.

## Subtasks

### 2.1 Migration Up
Buat `migrations/000001_init.up.sql` dengan tabel-tabel berikut:

| Tabel | Key Fields | Relasi |
|-------|------------|--------|
| **sections** | id, name, description | - |
| **locations** | id, name, description | - |
| **shifts** | id, name, start_time, end_time | - |
| **users** | id, name, email, password, role (SUPER_ADMIN/K3L/TIM_HSE), section_id | → sections |
| **assets** | id, name, asset_category (APAR/HYDRANT/FIRE_ALARM), serial_number, location_id, pic_id, section_id, plant, size, expired_at, qr_code | → locations, users, sections |
| **hse_parameters** | id, asset_category, parameter_name, input_type (boolean/numeric/text/option), unit, options, check_type (fisik/fungsi), sort_order, is_required | - |
| **patrols** | id, user_id, asset_id, shift_id, status (draft/submitted/waiting_approval/approved/rejected), client_uuid, approved_by, approved_at, rejection_reason, submitted_at | → users, assets, shifts |
| **patrol_details** | id, patrol_id, hse_parameter_id, value, is_anomaly, notes | → patrols, hse_parameters |
| **patrol_attachments** | id, patrol_id, patrol_detail_id, file_path, attachment_type, is_live_capture | → patrols, patrol_details |
| **alerts** | id, patrol_id, asset_id, pic_id, message, is_read, resolved_at | → patrols, assets, users |
| **activity_logs** | id, user_id, action, entity, entity_id, old_value, new_value, is_ghost | → users |

### 2.2 Migration Down
Buat `migrations/000001_init.down.sql` untuk rollback (DROP TABLE dengan urutan terbalik).

### 2.3 Database Seeder
Buat file seeder untuk data development:
- 3 Section: "Produksi", "Maintenance", "Gudang"
- 4 Location: "Area A", "Area B", "Area C", "Area D"
- 3 Shift: "Pagi (06:00-14:00)", "Siang (14:00-22:00)", "Malam (22:00-06:00)"
- 1 Super Admin (admin@inspecthse.com)
- 2 K3L Petugas
- 1 Tim HSE
- 6 Asset: 2 APAR, 2 Hydrant, 2 Fire Alarm
- HSE Parameters sesuai kategori aset

### 2.4 Migration Runner
Integrasi golang-migrate ke `cmd/server/main.go` untuk auto-migrate saat server start.

## Acceptance Criteria
- [ ] Semua tabel tercreate dengan foreign key dan indexing yang tepat
- [ ] Migration up & down berjalan sukses
- [ ] Seeder mengisi data development yang representatif
- [ ] ENUM type MySQL digunakan untuk kolom dengan nilai terbatas (role, status, category, dll)

## References
- PRD Section 10: Entity Relationship
- PRD Section 6: Functional Requirements (FR-01)
- `backend/migrations/000001_init.up.sql`
- `backend/migrations/000001_init.down.sql`
