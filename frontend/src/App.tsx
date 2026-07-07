import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ScanPage } from "@/pages/ScanPage";
import { InspeksiLapanganPage } from "@/pages/InspeksiLapanganPage";
import { InspeksiAssetPage } from "@/pages/InspeksiAssetPage";
import { ExportPage } from "@/pages/ExportPage";
import { MasterDataPage } from "@/pages/MasterDataPage";
import { PatrolListPage } from "@/pages/PatrolListPage";
import { PatrolDetailPage } from "@/pages/PatrolDetailPage";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/scan/:qrCode" element={<ScanPage />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/inspeksi-lapangan" element={<InspeksiLapanganPage />} />
            <Route path="/inspeksi-asset/:id" element={<InspeksiAssetPage />} />
            <Route path="/patrols" element={<PatrolListPage />} />
            <Route path="/patrols/:id" element={<PatrolDetailPage />} />
            <Route path="/export-hse" element={<ExportPage />} />
            <Route path="/master-data" element={<Navigate to="/sections" replace />} />
            <Route path="/:resource" element={<MasterDataPage />} />
          </Route>
        </Route>

        <Route path="*" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
