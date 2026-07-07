# Task 08: Dashboard & Charts per Role

## Deskripsi
Implementasi dashboard dengan statistik dan grafik interaktif yang berbeda untuk setiap role: Super Admin (overview sistem), K3L (statistik pribadi), Tim HSE (overview approval & tren).

## Subtasks

### 8.1 Backend — Dashboard Service

**Super Admin Dashboard** (`GET /api/v1/dashboard/super-admin`):
- Total patroli (all time & bulan ini)
- Total aset (per kategori)
- Total user (per role)
- Pie chart: distribusi status patroli (approved/rejected/waiting)
- Bar chart: tren inspeksi per bulan (12 bulan)
- Recent activity log (10 terakhir)

**K3L Dashboard** (`GET /api/v1/dashboard/k3l`):
- Total patroli pribadi (all time & bulan ini)
- Status patroli pribadi (count per status)
- Tren patroli pribadi per bulan (12 bulan)
- Recent patrols (5 terakhir dengan status)
- Anomali yang ditemukan (count)

**Tim HSE Dashboard** (`GET /api/v1/dashboard/tim-hse`):
- Total patroli perlu review (waiting_approval)
- Approval rate (approved / total reviewed)
- Rata-rata waktu review (dari submitted → approved/rejected)
- Tren approval per bulan
- Recent activity (approve/reject terbaru)

### 8.2 Frontend — Dashboard Components

**StatCard Component:**
- Icon, label, value, perubahan (↑↓)
- Warna sesuai konteks (hijau untuk positif, merah untuk negatif)

**Chart Components (Recharts):**
- `BarChart`: tren patroli per bulan
- `PieChart`: distribusi status
- `LineChart`: tren approval rate
- `AreaChart`: aktivitas recent

**DashboardPage (role-based rendering):**
- Detect role dari token/user context
- Render widget sesuai role
- Widget bisa di-custom oleh Super Admin (drag & resize opsional)

### 8.3 Widget Layouts

**Super Admin:**
```
[Total Patroli] [Total Aset] [Total User] [Pending Review]
[Tren Inspeksi 12 Bulan — Bar Chart (full width)]
[Status Distribution — Pie Chart] [Recent Activity — Timeline]
```

**K3L:**
```
[Patroli Saya] [Anomali Ditemukan] [Approval Rate]
[Tren Patroli — Bar Chart] [Recent Patrols — Table]
```

**Tim HSE:**
```
[Pending Review] [Approval Rate] [Rata-rata Waktu Review]
[Tren Approval — Line Chart] [Recent Activity — Timeline]
```

### 8.4 Data Fetching Strategy
- Gunakan React Query (TanStack Query) dengan:
  - `staleTime: 30_000` (30 detik)
  - `refetchInterval: 60_000` (auto refresh per menit untuk data real-time)
  - Loading skeleton saat fetch
  - Error state dengan retry button

## Acceptance Criteria
- [ ] Super Admin melihat statistik keseluruhan sistem
- [ ] K3L hanya melihat data patroli sendiri
- [ ] Tim HSE melihat overview + pending approvals
- [ ] Chart menampilkan data akurat (bar, pie, line)
- [ ] Data real-time dengan auto-refresh (30-60 detik)
- [ ] Loading state: skeleton component
- [ ] Error state: retry button
- [ ] Responsif: 1 kolom di mobile, 2-3 kolom di desktop

## References
- `backend/internal/service/dashboard.go`
- `backend/internal/handler/dashboard.go`
- `frontend/src/pages/DashboardPage.tsx`
- PRD FR-05: Dashboard & Monitoring
