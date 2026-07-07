# Task 06: QR Code Scan & Dynamic Inspection Form

## Deskripsi
Implementasi fitur scan QR Code untuk identifikasi aset, routing cerdas berdasarkan role, dan form inspeksi dinamis yang menyesuaikan kategori aset.

## Subtasks

### 6.1 Backend — Scan Endpoint
**`GET /api/v1/scan/{qrCode}`**:
- Cari aset berdasarkan qr_code
- Kembalikan data aset + relasi (location, section, pic)
- Frontend akan routing berdasarkan role user

### 6.2 Backend — Dynamic Parameter Endpoint
**`GET /api/v1/parameters?category={category}`**:
- Filter parameter berdasarkan asset_category
- Urutkan berdasarkan sort_order
- Kembalikan parameter dengan field: input_type, options, is_required, unit

### 6.3 Frontend — Scan Page
**`/scan/:qrCode`** (ScanPage.tsx):
- Terima QR code dari URL param
- Fetch data aset dari `/api/v1/scan/{qrCode}`
- Detect role dari localStorage/token claims:
  - K3L → redirect ke `/inspeksi-lapangan?asset_id={id}`
  - HSE/Super Admin → redirect ke `/inspeksi-asset/{id}`
- Loading spinner saat fetch
- Error handling jika QR code tidak valid

### 6.4 Frontend — Inspeksi Lapangan Page
**`/inspeksi-lapangan?asset_id={id}`** (InspeksiLapanganPage.tsx):

**Header Aset:**
- Nama aset, kategori, lokasi, serial number
- Masa berlaku (expired date dengan warning jika H-7)
- Foto aset (jika ada)

**Dynamic Form:**
- Fetch parameters dari `/api/v1/parameters?category={asset_category}`
- Render field sesuai `input_type`:
  - **boolean**: dua tombol "Ya" / "Tidak" (toggle dengan warna: hijau/merah)
  - **numeric**: input number dengan unit
  - **text**: input text / textarea
  - **option**: dropdown select
- Tandai field required dengan asterisk (*)
- Validasi: required field tidak boleh kosong

**Anomali Detection:**
- Jika parameter bernilai "Tidak" (boolean false), "X", atau 0 → tandai sebagai anomali
- Munculkan section upload foto spesifik untuk parameter anomali
- Upload dari kamera (react-webcam) atau galeri (file input)

**Submission:**
- Generate client_uuid (UUID v4) untuk cegah duplikasi
- Submit ke `/api/v1/patrols` (POST)
- Data: asset_id, shift_id, client_uuid, details[], attachments[]
- Loading state saat submit
- Success page dengan ringkasan
- Error handling: duplicate submission

### 6.5 Frontend — Kamera Component
- Gunakan react-webcam untuk akses kamera HP
- Mode: langsung capture (prefer) atau galeri
- Preview foto sebelum submit
- Konfirmasi hapus/re-take

### 6.6 Frontend — Inspeksi Asset Page
**`/inspeksi-asset/:id`** (InspeksiAssetPage.tsx):
- Untuk role HSE dan Super Admin
- Tampilkan histori patroli aset (table)
- Detail setiap patroli: parameter + nilai + foto
- Status badge (approved/waiting/rejected)

## Acceptance Criteria
- [ ] Scan QR oleh K3L → form inspeksi dengan data aset terisi otomatis
- [ ] Form menampilkan parameter sesuai kategori aset
- [ ] 4 tipe input berfungsi: boolean toggle, numeric, text, option dropdown
- [ ] Parameter required tidak bisa dikosongkan
- [ ] Deteksi anomali: nilai "Tidak"/0/"X" → trigger upload foto
- [ ] Upload foto dari kamera langsung (react-webcam)
- [ ] Upload foto dari galeri
- [ ] Duplikasi submit tercegah oleh client_uuid
- [ ] Scan QR oleh HSE → histori aset

## References
- `frontend/src/pages/ScanPage.tsx`
- `frontend/src/pages/InspeksiLapanganPage.tsx`
- `frontend/src/pages/InspeksiAssetPage.tsx`
- `backend/internal/handler/asset.go` (GetByQRCode)
- PRD FR-02: QR Code
- PRD FR-03: Form Inspeksi Lapangan
