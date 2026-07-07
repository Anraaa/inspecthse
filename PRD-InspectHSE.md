# Product Requirements Document (PRD) — InspectHSE

## 1. Ringkasan Eksekutif

**InspectHSE** adalah sistem manajemen inspeksi K3L (Keselamatan, Kesehatan Kerja, dan Lingkungan) berbasis web yang mendigitalisasi proses patroli dan pemeriksaan alat keselamatan di lingkungan industri/plant. Sistem ini menggantikan *paper-based checklist* (HSE-F-15, HSE-F-83) dengan alur kerja digital berbasis QR Code, dynamic form, dan approval workflow.

### Masalah yang Diselesaikan

- Pencatatan inspeksi masih manual (kertas) → rawan hilang, sulit dilacak
- Tidak ada standarisasi pengisian form inspeksi
- Validasi dan approval patroli tidak terstruktur
- Rekap tahunan untuk checksheet masih dikerjakan manual
- Monitoring kondisi aset keselamatan tidak *real-time*

### Solusi

Aplikasi web dengan role-based access (Super Admin, K3L Petugas Lapangan, Tim HSE) yang memungkinkan:
1. Scan QR untuk memulai inspeksi
2. Form inspeksi dinamis yang menyesuaikan kategori aset
3. Upload foto bukti temuan anomali
4. Alur approval (submit → waiting approval → approved/rejected)
5. Dashboard monitoring real-time
6. Export checksheet tahunan format Excel

---

## 2. Latar Belakang

Berdasarkan kebutuhan HSE (Health, Safety & Environment) di lingkungan pabrik/plant, setiap aset keselamatan seperti:
- **APAR** (Alat Pemadam Api Ringan)
- **Hydrant**
- **Fire Alarm** (manual & otomatis)

...wajib diperiksa secara berkala meliputi **pengecekan fisik** (bulanan) dan **pengecekan fungsi** (semester). Inspeksi ini diatur dalam standar HSE yang mewajibkan dokumentasi checksheet yang sah, akurat, dan *auditable*.

Proses bisnis saat ini masih menggunakan lembar checksheet fisik (kertas) yang diisi petugas lapangan, ditandatangani, dan dikumpulkan ke tim HSE untuk direview. Kelemahannya:

| Masalah | Dampak |
|---------|--------|
| Kertas mudah rusak/hilang | Data inspeksi tidak terdokumentasi |
| Tulisan tangan tidak terbaca | Kesalahan input data rekap |
| Rekap tahunan manual | Memakan waktu dan rentan human error |
| Approval tidak tercatat | Tidak ada audit trail yang jelas |
| Monitoring tidak real-time | Keterlambatan tindak lanjut temuan |

Dengan **InspectHSE**, seluruh proses didigitalisasi — dari scan QR aset, pengisian form, upload bukti foto, approval, hingga export checksheet tahunan.

---

## 3. Tujuan

| Tujuan | Deskripsi |
|--------|-----------|
| **Digitalisasi Inspeksi** | Mengganti form kertas dengan form digital dinamis |
| **Standarisasi Data** | Setiap kategori aset memiliki parameter inspeksi yang terstandarisasi |
| **Audit Trail** | Seluruh aktivitas inspeksi tercatat (siapa, kapan, apa) |
| **Monitoring Real-time** | Dashboard untuk memantau status patroli dan temuan anomali |
| **Efisiensi Rekap** | Export checksheet tahunan dalam 1 klik |
| **Notifikasi Otomatis** | Peringatan aset expired, anomali, dan status approval |

---

## 4. Scope

### In Scope

- Manajemen master data: aset, lokasi, section, shift, parameter HSE, pengguna
- Generate dan print QR Code untuk setiap aset
- Scan QR Code → redirect ke form inspeksi (K3L) / halaman review (HSE)
- Form inspeksi dinamis berdasarkan kategori aset dan parameter HSE
- Upload foto dari kamera langsung maupun galeri
- Deteksi anomali otomatis berdasarkan nilai parameter
- Approval workflow (submit → waiting → approved / rejected)
- Dashboard statistik dan grafik per role
- Export checksheet tahunan format Excel (HSE-F-15, HSE-F-83)
- Import data aset dari Excel
- Notifikasi database: anomali, aset expired, status approval
- Role-based access control (Super Admin, K3L, Tim HSE)

### Out of Scope

- Mobile native app (menggunakan PWA/responsive web)
- Integrasi dengan sistem ERP/SAP existing
- OCR untuk barcode non-QR
- Offline mode penuh (hanya client UUID untuk deteksi duplikat)
- Multi-language / i18n (saat ini hanya Bahasa Indonesia)

---

## 5. User Roles & Personas

### 5.1 Super Admin

**Deskripsi:** Administrator sistem dengan akses penuh ke seluruh fitur.

**Karakteristik:**
- Membuat dan mengelola seluruh master data
- Melakukan ghost edit pada data patroli
- Melihat dashboard sistem secara keseluruhan
- Export data checksheet
- Mengelola user, role, permission

**Hak Akses:**
- CRUD semua resource (Asset, Location, Section, Shift, Parameter, User, Patrol, Alert)
- Ghost edit patrol details
- Akses semua widget dashboard
- Export HSE
- Import aset

### 5.2 K3L Section (Petugas Lapangan)

**Deskripsi:** Petugas K3L yang melakukan patroli dan inspeksi aset di lapangan.

**Karakteristik:**
- Melakukan scan QR aset
- Mengisi form inspeksi sesuai kondisi di lapangan
- Mengambil foto bukti temuan
- Submit patroli untuk direview
- Melihat histori patroli pribadi

**Hak Akses:**
- Scan QR → form inspeksi
- Submit patroli (status → waiting_approval)
- Lihat patroli milik sendiri
- Dashboard petugas (stats pribadi)

### 5.3 Tim HSE / PIC

**Deskripsi:** Supervisor / penanggung jawab HSE yang mereview dan memvalidasi hasil patroli.

**Karakteristik:**
- Menerima notifikasi patroli baru yang perlu direview
- Melihat detail hasil inspeksi + foto bukti
- Menyetujui (approve) atau menolak (reject) patroli
- Memberikan catatan rejection
- Memonitor tren inspeksi dan temuan anomali

**Hak Akses:**
- Scan QR → review histori aset
- Approve / reject patroli
- Dashboard tim HSE (stats overview, tren approval)
- Lihat semua patroli

---

## 6. Functional Requirements

### FR-01: Manajemen Master Data

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-01.01 | Sistem dapat mengelola data **Section** (nama, deskripsi) | P1 |
| FR-01.02 | Sistem dapat mengelola data **Location** (nama, deskripsi) | P1 |
| FR-01.03 | Sistem dapat mengelola data **Shift** (nama, jam mulai, jam selesai) | P1 |
| FR-01.04 | Sistem dapat mengelola data **Asset** (nama, kategori, serial number, lokasi, PIC, section, plant, ukuran, expired date, QR code, status aktif) | P1 |
| FR-01.05 | Sistem dapat mengelola data **HSE Parameter** (nama parameter, kategori aset, tipe input, unit, opsi, tipe cek, sort order, required) | P1 |
| FR-01.06 | Sistem dapat mengelola data **User** (nama, email, password, role, section) | P1 |

### FR-02: QR Code

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-02.01 | Sistem dapat **generate QR Code** unik untuk setiap aset | P1 |
| FR-02.02 | Sistem menyediakan halaman untuk **print QR Code** massal | P1 |
| FR-02.03 | Scan QR Code mengarah ke endpoint `/scan/{qr_code}` | P1 |
| FR-02.04 | Sistem melakukan **routing cerdas**: K3L → form inspeksi, HSE → review histori | P1 |

### FR-03: Form Inspeksi Lapangan

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-03.01 | Form inspeksi **dinamis** menyesuaikan kategori aset dan parameter HSE | P1 |
| FR-03.02 | Mendukung 4 tipe input: **boolean** (toggle ya/tidak), **numeric**, **text**, **option** (dropdown) | P1 |
| FR-03.03 | Parameter yang bersifat **required** wajib diisi sebelum submit | P1 |
| FR-03.04 | **Deteksi anomali otomatis**: jika nilai menunjukkan masalah (false, "X", 0), muncul section upload foto | P1 |
| FR-03.05 | Petugas dapat memilih sumber foto: **kamera langsung** atau **galeri** | P1 |
| FR-03.06 | Setiap detail inspeksi menyimpan `client_uuid` untuk **cegah duplikasi submit** | P2 |
| FR-03.07 | Form menampilkan informasi aset (nama, kategori, lokasi, masa berlaku) | P1 |

### FR-04: Submission & Approval

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-04.01 | Petugas dapat **submit** hasil inspeksi → status `waiting_approval` | P1 |
| FR-04.02 | Submit mencatat: patrol header + detail parameter + attachment foto/tanda tangan | P1 |
| FR-04.03 | Tim HSE dapat **approve** patroli → status `approved`, tercatat `approved_by` dan `approved_at` | P1 |
| FR-04.04 | Tim HSE dapat **reject** patroli → status `rejected`, wajib mengisi alasan penolakan | P1 |
| FR-04.05 | Super Admin dapat **ghost edit** nilai detail patroli tanpa mengubah histori approval | P2 |
| FR-04.06 | Status patroli: `draft`, `submitted`, `waiting_approval`, `approved`, `rejected` | P1 |

### FR-05: Dashboard & Monitoring

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-05.01 | Dashboard **Super Admin**: stats overview, tren inspeksi, pie chart status, pending approval, recent activity | P1 |
| FR-05.02 | Dashboard **K3L**: stats pribadi, tren patroli pribadi, status patroli, recent patrols, anomali | P1 |
| FR-05.03 | Dashboard **Tim HSE**: stats HSE, tren approval, distribusi patroli, pending approvals, activity | P1 |
| FR-05.04 | Widget menampilkan data real-time dengan grafik interaktif | P2 |

### FR-06: Export & Import

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-06.01 | **Export checksheet tahunan** format Excel sesuai template HSE-F-15 (APAR) dan HSE-F-83 (Fire Alarm) | P1 |
| FR-06.02 | Export dapat difilter berdasarkan tahun, kategori aset, lokasi, section | P1 |
| FR-06.03 | Export menyertakan hasil inspeksi per bulan dalam 1 sheet | P1 |
| FR-06.04 | **Import aset** dari Excel menggunakan template yang telah ditentukan | P2 |

### FR-07: Notifikasi

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-07.01 | Notifikasi **anomali** dikirim ke PIC aset saat ditemukan nilai abnormal | P1 |
| FR-07.02 | Notifikasi **aset expired** dikirim H-7 sebelum masa berlaku habis | P2 |
| FR-07.03 | Notifikasi **patroli disetujui** dikirim ke petugas pengaju | P2 |
| FR-07.04 | Notifikasi **patroli ditolak** dikirim ke petugas pengaju (dengan alasan) | P2 |

### FR-08: Activity Log

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-08.01 | Setiap perubahan pada detail patroli tercatat di activity log | P2 |
| FR-08.02 | Ghost edit oleh Super Admin tercatat secara terpisah | P2 |

---

## 7. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | **Performance** — Waktu muat halaman dashboard < 3 detik | P1 |
| NFR-02 | **Performance** — Submit form inspeksi < 2 detik | P1 |
| NFR-03 | **Security** — Role-based access control (RBAC) dengan middleware JWT claims | P1 |
| NFR-04 | **Security** — Semua request diautentikasi via JWT (access + refresh token) | P1 |
| NFR-05 | **Security** — Upload file divalidasi tipe dan ukuran | P1 |
| NFR-06 | **Reliability** — Sistem berjalan di Docker container | P1 |
| NFR-07 | **Reliability** — Refresh token rotation dengan deteksi reuse | P1 |
| NFR-08 | **Usability** — UI responsif (desktop & tablet) | P1 |
| NFR-09 | **Usability** — Form inspeksi mudah digunakan di lapangan | P1 |
| NFR-10 | **Code Quality** — Golangci-lint (gofmt, govet, staticcheck), Prettier + ESLint | P2 |

---

## 8. User Stories

### Epic: Patroli Lapangan

| Story ID | Sebagai... | Saya ingin... | Sehingga... |
|----------|------------|---------------|-------------|
| US-01 | Petugas K3L | scan QR aset dan langsung masuk ke form inspeksi | tidak perlu mencari data aset manual |
| US-02 | Petugas K3L | form inspeksi yang menyesuaikan jenis aset | hanya mengisi parameter yang relevan |
| US-03 | Petugas K3L | mengupload foto temuan dari kamera HP | bukti visual akurat dan real-time |
| US-04 | Petugas K3L | submit hasil inspeksi dalam 1 langkah | tidak ada data yang terlewat |

### Epic: Approval

| Story ID | Sebagai... | Saya ingin... | Sehingga... |
|----------|------------|---------------|-------------|
| US-05 | Tim HSE | melihat daftar patroli yang perlu direview | tidak ada patroli terlewat |
| US-06 | Tim HSE | melihat detail inspeksi termasuk foto bukti | bisa memvalidasi temuan |
| US-07 | Tim HSE | menyetujui patroli dengan 1 klik | proses approval efisien |
| US-08 | Tim HSE | menolak patroli dengan alasan yang jelas | petugas tahu apa yang harus diperbaiki |

### Epic: Monitoring

| Story ID | Sebagai... | Saya ingin... | Sehingga... |
|----------|------------|---------------|-------------|
| US-09 | Super Admin | melihat dashboard statistik keseluruhan | bisa memonitor performa tim |
| US-10 | Tim HSE | melihat tren inspeksi per bulan | bisa evaluasi kepatuhan |
| US-11 | Petugas K3L | melihat histori patroli saya sendiri | bisa tracking progress pribadi |

### Epic: Reporting

| Story ID | Sebagai... | Saya ingin... | Sehingga... |
|----------|------------|---------------|-------------|
| US-12 | Super Admin | export checksheet tahunan dalam format Excel | tidak perlu rekap manual |
| US-13 | Super Admin | filter export berdasarkan kategori/lokasi | data yang diexport sesuai kebutuhan |

---

## 9. Workflow / Business Process

### 9.1 Alur Inspeksi

```
Petugas Login
      ↓
Scan QR Aset
      ↓
Sistem Cek Role
      ├── K3L → Form Inspeksi (InspeksiLapangan)
      └── HSE → Review Histori Aset (InspeksiAssetPage)
              ↓
Form Menampilkan Parameter HSE sesuai Kategori Aset
      ↓
Petugas Mengisi Nilai Parameter
      ↓
Jika Nilai Anomali → Upload Foto Bukti
      ↓
Submit Patroli
      ↓
Status → waiting_approval
      ↓
Tim HSE Menerima Notifikasi
      ↓
Review Detail + Foto
      ├── Approve → Status approved
      └── Reject → Wajib isi alasan → Status rejected
              ↓
Petugas Menerima Notifikasi Hasil Approval
```

### 9.2 State Machine Status Patroli

```
draft → submitted → waiting_approval → approved
                                     → rejected
```

### 9.3 Alur Export Checksheet

```
Admin Buka Halaman Export
      ↓
Pilih Tahun, Kategori, Filter
      ↓
Sistem Generate Excel dengan Format:
├── Header: Info Perusahaan + Judul
├── Tabel: Baris = Aset, Kolom = Bulan (Jan-Dec)
├── Nilai: Status inspeksi tiap bulan
└── Footer: Tanda tangan, paraf
      ↓
Download File .xlsx
```

---

## 10. Entity Relationship Ringkas

```
sections 1──* assets
locations 1──* assets
users     1──* assets (as PIC)
shifts    1──* patrols
users     1──* patrols (as petugas)
assets    1──* patrols
patrols   1──* patrol_details
patrols   1──* patrol_attachments
hse_parameters 1──* patrol_details
patrols   1──* alerts
patrol_details 1──* alerts
```

### Deskripsi Entity Utama

| Entity | Deskripsi | Key Fields |
|--------|-----------|------------|
| `sections` | Departemen/divisi perusahaan | id, name |
| `locations` | Area/lokasi fisik aset ditempatkan | id, name, description |
| `shifts` | Shift kerja | id, name, start_time, end_time |
| `assets` | Master alat keselamatan | id, name, asset_category, serial_number, location_id, pic_id, qr_code, expired_at |
| `hse_parameters` | Definisi parameter inspeksi (dynamic form builder) | id, asset_category, parameter_name, input_type, check_type, is_required, sort_order |
| `patrols` | Header transaksi inspeksi | id, user_id, asset_id, shift_id, status, approved_by, approved_at, rejection_reason |
| `patrol_details` | Nilai jawaban parameter | id, patrol_id, hse_parameter_id, value, is_anomaly, notes |
| `patrol_attachments` | File bukti foto/tanda tangan | id, patrol_id, patrol_detail_id, file_path, attachment_type, is_live_capture |
| `alerts` | Notifikasi temuan anomali | id, patrol_id, asset_id, pic_id, message, is_read, resolved_at |

---

## 11. UI / UX Guidelines

### 11.1 Arsitektur Frontend

- **Framework:** React 18+ dengan TypeScript
- **Build Tool:** Vite
- **CSS Framework:** Tailwind CSS 3
- **State Management:** React Query (TanStack Query) untuk server state + Zustand untuk client state
- **Routing:** React Router v6
- **UI Component Library:** shadcn/ui (Radix UI primitives)
- **Form Handling:** React Hook Form + Zod untuk validasi
- **HTTP Client:** Axios / ky
- **Charts:** Recharts / Chart.js
- **PDF/Excel Preview:** react-excel-renderer / xlsx (SheetJS)

### 11.2 Halaman Utama (SPA)

| Halaman | Route | Deskripsi |
|---------|-------|-----------|
| Login | `/login` | Autentikasi user JWT-based |
| Dashboard | `/dashboard` | Role-based dashboard dengan widget |
| Scan QR | `/scan/:qrCode` | Redirect cerdas berdasarkan role |
| Form Inspeksi | `/inspeksi-lapangan` | Form dinamis untuk input hasil patroli |
| Review Aset | `/inspeksi-asset/:id` | Histori inspeksi untuk tim HSE |
| Export HSE | `/export-hse` | Generate checksheet tahunan |
| Resources CRUD | `/:resource` | Manajemen master data |

### 11.3 Prinsip UX

- **Mobile-first**: Form inspeksi dioptimalkan untuk penggunaan di HP/tablet
- **Minimal klik**: Scan QR langsung masuk form, submit 1 langkah
- **Visual feedback**: Status warna (hijau = approved, merah = rejected, kuning = waiting)
- **Foto capture**: Bisa dari kamera langsung (prefer) atau galeri
- **Error handling**: Validasi client-side + server-side
- **Loading state**: Tampilkan spinner/skeleton saat proses

---

## 12. Acceptance Criteria

### AC-01: Setup & Master Data
- [ ] Super Admin dapat login dan melihat dashboard
- [ ] CRUD Section, Location, Shift berfungsi penuh
- [ ] CRUD Asset berfungsi dengan semua field
- [ ] Generate QR Code untuk setiap aset berhasil
- [ ] CRUD HSE Parameter berfungsi dengan 4 tipe input
- [ ] CRUD User dengan assignment role berfungsi

### AC-02: Inspeksi Lapangan
- [ ] Scan QR oleh K3L membuka form inspeksi dengan data aset terisi
- [ ] Form menampilkan parameter sesuai kategori aset
- [ ] Input boolean (toggle) dapat diisi ya/tidak
- [ ] Input numeric menerima angka
- [ ] Input text menerima teks
- [ ] Dropdown option menampilkan pilihan dari parameter
- [ ] Parameter required tidak bisa dikosongkan
- [ ] Deteksi anomali muncul saat nilai menunjukkan masalah
- [ ] Upload foto dari kamera dan galeri berfungsi
- [ ] Submit berhasil → status `waiting_approval`
- [ ] Duplikasi submit terdeteksi (client_uuid)

### AC-03: Approval
- [ ] Tim HSE melihat daftar pending approval
- [ ] Tim HSE dapat melihat detail patroli + foto
- [ ] Approve → status berubah jadi `approved`, tercatat approver
- [ ] Reject → status `rejected`, alasan tersimpan
- [ ] Notifikasi approval/rejection terkirim

### AC-04: Dashboard
- [ ] Super Admin melihat statistik yang benar
- [ ] K3L hanya melihat data patroli sendiri
- [ ] Tim HSE melihat data overview dan pending approval
- [ ] Grafik dan chart menampilkan data akurat

### AC-05: Export
- [ ] Export checksheet tahunan menghasilkan file .xlsx
- [ ] Format sesuai template HSE-F-15 atau HSE-F-83
- [ ] Data per bulan terisi dengan benar
- [ ] Filter tahun, kategori, lokasi berfungsi

### AC-06: Notifikasi
- [ ] Anomali menghasilkan alert ke PIC aset
- [ ] User menerima notifikasi database
- [ ] Notifikasi aset expired bekerja via cron

---

## 13. Tech Stack & Architecture

### 13.1 Backend (Golang)

| Layer | Teknologi |
|-------|-----------|
| **Bahasa** | Go 1.22+ |
| **HTTP Framework** | Chi router / Gin |
| **Arsitektur** | Clean Architecture / Hexagonal (handler → service → repository) |
| **Database** | PostgreSQL 16 |
| **ORM / DB Library** | sqlx (query builder) + sqlc (type-safe generated queries) |
| **Migration** | golang-migrate |
| **Cache** | Redis 7 |
| **Queue / Async** | Asynq (Redis-based task queue) |
| **Auth** | JWT (golang-jwt) — access token (15menit) + refresh token (7hari) |
| **RBAC** | Casbin / custom middleware berbasis claims JWT |
| **QR Code** | go-qrcode (boombuler/barcode) |
| **Excel Export** | excelize |
| **Excel Import** | excelize + mapstructure |
| **Image Processing** | nfnt/resize or Go built-in image |
| **Validation** | go-playground/validator |
| **Logging** | zerolog / slog |
| **Config** | viper |
| **Testing** | Go testing + testify + miniredis + sqlmock |

### 13.2 Frontend (React)

| Layer | Teknologi |
|-------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **State Management** | TanStack Query (React Query) + Zustand |
| **Routing** | React Router v6 |
| **UI Components** | shadcn/ui (Radix UI primitives) |
| **Styling** | Tailwind CSS 3 |
| **Form** | React Hook Form + Zod |
| **Charts** | Recharts |
| **HTTP Client** | Axios dengan interceptor JWT |
| **Camera / Upload** | react-webcam + file input |
| **PWA** | vite-plugin-pwa (manifest + service worker) |
| **Testing** | Vitest + React Testing Library + Playwright (E2E) |

### 13.3 Infrastruktur

| Layer | Teknologi |
|-------|-----------|
| **Container** | Docker Compose |
| **Reverse Proxy** | Nginx atau Caddy |
| **Database** | PostgreSQL 16 |
| **Cache & Queue** | Redis 7 |
| **CI/CD** | GitHub Actions (golangci-lint, go test, Vitest, Playwright) |
| **API Format** | RESTful JSON |
| **Documentation** | OpenAPI / Swagger (swaggo) |

---

## 14. Milestone & Timeline

| Fase | Fitur | Target |
|------|-------|--------|
| **Fase 1** | Setup project Go + React, boilerplate, CI/CD, Docker Compose | 📅 ||
| **Fase 2** | Database schema (migration), seeder, repository layer | 📅 ||
| **Fase 3** | Auth & RBAC (register, login, JWT, refresh token, middleware) | 📅 ||
| **Fase 4** | CRUD master data (Asset, Location, Section, Shift, Parameter, User) — backend + halaman React | 📅 ||
| **Fase 5** | QR Code generate & scan, form inspeksi dinamis | 📅 ||
| **Fase 6** | Submit patroli, approval workflow, notifikasi | 📅 ||
| **Fase 7** | Dashboard & grafik per role | 📅 ||
| **Fase 8** | Export checksheet tahunan + import aset Excel | 📅 ||
| **Fase 9** | PWA, optimasi, UAT, bug fixing, deployment | 📅 ||

---

## 15. Glossary

| Istilah | Definisi |
|---------|----------|
| **APAR** | Alat Pemadam Api Ringan (Fire Extinguisher) |
| **HSE** | Health, Safety & Environment (K3L) |
| **K3L** | Keselamatan, Kesehatan Kerja, dan Lingkungan |
| **PIC** | Person In Charge — penanggung jawab aset |
| **Checksheet** | Lembar pemeriksaan formal HSE |
| **Patroli** | Kegiatan inspeksi lapangan terhadap aset HSE |
| **Anomali** | Kondisi abnormal/nilai tidak sesuai standar |
| **Ghost Edit** | Edit data oleh Super Admin tanpa mengubah histori audit |
| **QR Code** | Quick Response Code — kode batang 2D untuk identifikasi aset |
| **HSE-F-15** | Kode form checksheet alat pemadam kebakaran (APAR) |
| **HSE-F-83** | Kode form checksheet alarm kebakaran |
| **Cek Fisik** | Pemeriksaan fisik bulanan (kondisi, kebersihan, akses) |
| **Cek Fungsi** | Pemeriksaan fungsi semester (tekanan, kelayakan pakai) |
