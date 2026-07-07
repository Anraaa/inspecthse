# Task 09: Export Checksheet & Import Assets

## Deskripsi
Implementasi export checksheet tahunan format Excel (HSE-F-15 untuk APAR, HSE-F-83 untuk Fire Alarm) dan import data aset dari Excel.

## Subtasks

### 9.1 Backend — Export Service

**Export Checksheet** (`GET /api/v1/export/checksheet`):
- Filter: year (required), category (required), location_id (optional), section_id (optional)
- Query: semua aset sesuai filter + patrol per bulan di tahun tersebut
- Format Excel menggunakan excelize:

```
Sheet: "Checksheet [Tahun]"

Row 1: Header Perusahaan + Judul "Checksheet Inspeksi [Kategori] [Tahun]"
Row 2: (kosong)
Row 3: Tabel Header:
  | No | Nama Aset | Serial Number | Lokasi | Jan | Feb | Mar | ... | Dec |
Row 4+: Data per aset
  - Kolom Jan-Dec: status inspeksi per bulan
  - Nilai: "✓" (approved), "✗" (rejected), "~" (waiting), "-" (belum inspeksi)
Row Footer: Keterangan + kolom tanda tangan & paraf

Sheet 2: "Detail Temuan"
  - Daftar anomali yang ditemukan sepanjang tahun
  - per row: tanggal, aset, parameter, nilai, foto (link)

Cell styling:
  - Bold header
  - Border semua cell
  - Warna: hijau untuk approved, merah untuk rejected
  - Auto-fit column width
```

**Template HSE-F-15 (APAR):**
- Format spesifik untuk checksheet APAR
- Header: nomor form, revisi, tanggal terbit
- Footer: kolom tanda tangan petugas + supervisor

**Template HSE-F-83 (Fire Alarm):**
- Format spesifik untuk checksheet Fire Alarm
- Kolom tambahan: tipe alarm (manual/automatic), lokasi panel

### 9.2 Backend — Import Assets

**Import Assets** (`POST /api/v1/import/assets`):
- Terima file Excel multipart
- Parse menggunakan excelize
- Validasi template: kolom wajib (name, category, serial_number, location_id)
- Validasi data: foreign key exists, unique constraint
- Response: success count, error rows dengan detail

**Template Import:**
```
| name | category | serial_number | location_id | pic_id | section_id | plant | size | expired_at |
```

### 9.3 Frontend — Export Page
**`/export-hse`**:
- Form filter: year dropdown, kategori (APAR/Hydrant/Fire Alarm), lokasi (dropdown), section (dropdown)
- Preview: informasi jumlah data yang akan diexport (count aset)
- Button "Download Excel" → download file
- Loading progress bar (untuk export besar)
- History export (log siapa, kapan, filter apa)

### 9.4 Frontend — Import Page
- Drag & drop file upload (.xlsx only)
- Preview data sebelum import (table dengan highlight error)
- Validasi client-side: kolom wajib, format
- Import progress bar
- Result: success count + error details (dapat di-download sebagai CSV)

## Acceptance Criteria
- [ ] Export checksheet menghasilkan file .xlsx valid
- [ ] Format sesuai template HSE-F-15 (APAR) atau HSE-F-83 (Fire Alarm)
- [ ] Data per bulan terisi dengan benar (✓, ✗, ~, -)
- [ ] Filter tahun, kategori, lokasi berfungsi
- [ ] Cell styling: border, warna, bold header
- [ ] Import aset dari Excel dengan validasi
- [ ] Error handling: format file salah, data invalid
- [ ] Frontend: progress bar, preview, error details
- [ ] Download file di browser

## References
- `backend/internal/service/export.go`
- `backend/internal/handler/export.go`
- `frontend/src/pages/ExportPage.tsx`
- PRD FR-06: Export & Import
- PRD Section 9.3: Alur Export Checksheet
