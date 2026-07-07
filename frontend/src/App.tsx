import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InstallPWA } from "@/components/InstallPWA";
import { OnlineStatus } from "@/components/OnlineStatus";
import { PageSkeleton } from "@/components/Skeleton";

const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ScanPage = lazy(() => import("@/pages/ScanPage").then((m) => ({ default: m.ScanPage })));
const InspeksiLapanganPage = lazy(() => import("@/pages/InspeksiLapanganPage").then((m) => ({ default: m.InspeksiLapanganPage })));
const InspeksiAssetPage = lazy(() => import("@/pages/InspeksiAssetPage").then((m) => ({ default: m.InspeksiAssetPage })));
const ExportPage = lazy(() => import("@/pages/ExportPage").then((m) => ({ default: m.ExportPage })));
const MasterDataPage = lazy(() => import("@/pages/MasterDataPage").then((m) => ({ default: m.MasterDataPage })));
const PatrolListPage = lazy(() => import("@/pages/PatrolListPage").then((m) => ({ default: m.PatrolListPage })));
const PatrolDetailPage = lazy(() => import("@/pages/PatrolDetailPage").then((m) => ({ default: m.PatrolDetailPage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));
const ForbiddenPage = lazy(() => import("@/pages/ForbiddenPage").then((m) => ({ default: m.ForbiddenPage })));
const ServerErrorPage = lazy(() => import("@/pages/ServerErrorPage").then((m) => ({ default: m.ServerErrorPage })));
const OfflinePage = lazy(() => import("@/pages/OfflinePage").then((m) => ({ default: m.OfflinePage })));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

function App() {
  return (
    <BrowserRouter>
      <OnlineStatus />
      <InstallPWA />
      <Routes>
        <Route path="/login" element={<SuspenseWrapper><LoginPage /></SuspenseWrapper>} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<SuspenseWrapper><DashboardPage /></SuspenseWrapper>} />
            <Route path="/scan/:qrCode" element={<SuspenseWrapper><ScanPage /></SuspenseWrapper>} />
            <Route path="/scan" element={<SuspenseWrapper><ScanPage /></SuspenseWrapper>} />
            <Route path="/inspeksi-lapangan" element={<SuspenseWrapper><InspeksiLapanganPage /></SuspenseWrapper>} />
            <Route path="/inspeksi-asset/:id" element={<SuspenseWrapper><InspeksiAssetPage /></SuspenseWrapper>} />
            <Route path="/patrols" element={<SuspenseWrapper><PatrolListPage /></SuspenseWrapper>} />
            <Route path="/patrols/:id" element={<SuspenseWrapper><PatrolDetailPage /></SuspenseWrapper>} />
            <Route path="/export-hse" element={<SuspenseWrapper><ExportPage /></SuspenseWrapper>} />
            <Route path="/403" element={<SuspenseWrapper><ForbiddenPage /></SuspenseWrapper>} />
            <Route path="/500" element={<SuspenseWrapper><ServerErrorPage /></SuspenseWrapper>} />
            <Route path="/offline" element={<SuspenseWrapper><OfflinePage /></SuspenseWrapper>} />
            <Route path="/master-data" element={<Navigate to="/sections" replace />} />
            <Route path="/:resource" element={<SuspenseWrapper><MasterDataPage /></SuspenseWrapper>} />
          </Route>
        </Route>

        <Route path="*" element={<SuspenseWrapper><NotFoundPage /></SuspenseWrapper>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
