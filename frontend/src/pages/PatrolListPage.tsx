import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Patrol, Asset, Shift } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/lib/theme";
import { formatDate } from "@/lib/utils";
import { ClipboardCheck, Clock, CheckCircle, XCircle, Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft: { label: "Draft", color: "text-gray-600", bg: "bg-gray-100", icon: Clock },
  submitted: { label: "Submitted", color: "text-blue-600", bg: "bg-blue-100", icon: ClipboardCheck },
  waiting_approval: { label: "Menunggu", color: "text-yellow-600", bg: "bg-yellow-100", icon: Clock },
  approved: { label: "Disetujui", color: "text-green-600", bg: "bg-green-100", icon: CheckCircle },
  rejected: { label: "Ditolak", color: "text-red-600", bg: "bg-red-100", icon: XCircle },
};

export function PatrolListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialStatus = searchParams.get("status") || "";
  const initialLocation = searchParams.get("location_id") || "";
  const initialAsset = searchParams.get("asset_id") || "";

  const { user } = useAuthStore();
  const theme = useThemeStore((s) => s.theme);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [locationFilter, setLocationFilter] = useState(initialLocation);
  const [assetFilter, setAssetFilter] = useState(initialAsset);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 15;

  const isK3L = user?.role === "K3L";

  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "");
    setLocationFilter(searchParams.get("location_id") || "");
    setAssetFilter(searchParams.get("asset_id") || "");
    setPage(0);
  }, [searchParams]);

  // Fetch location name if filtered
  const { data: locationData } = useQuery({
    queryKey: ["location-by-id", locationFilter],
    queryFn: async () => {
      const res = await api.get(`/locations/${locationFilter}`);
      return res.data;
    },
    enabled: !!locationFilter,
  });

  // Fetch asset name if filtered
  const { data: assetData } = useQuery({
    queryKey: ["asset-by-id", assetFilter],
    queryFn: async () => {
      const res = await api.get(`/assets/${assetFilter}`);
      return res.data;
    },
    enabled: !!assetFilter,
  });

  // Fetch assets for name lookup
  const { data: assetMap } = useQuery({
    queryKey: ["all-assets-lookup"],
    queryFn: async () => {
      const res = await api.get("/assets", { params: { limit: 1000 } });
      const assets = (res.data?.data || []) as Asset[];
      const map: Record<number, string> = {};
      for (const a of assets) map[a.id] = a.name;
      return map;
    },
  });

  // Fetch shifts for name lookup
  const { data: shiftMap } = useQuery({
    queryKey: ["all-shifts-lookup"],
    queryFn: async () => {
      const res = await api.get("/shifts");
      const shifts = (res.data || []) as Shift[];
      const map: Record<number, string> = {};
      for (const s of shifts) map[s.id] = s.name;
      return map;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["patrols", statusFilter, locationFilter, assetFilter, search, page, user?.user_id],
    queryFn: async () => {
      const params: Record<string, any> = { limit, offset: page * limit };
      if (statusFilter) params.status = statusFilter;
      if (locationFilter) params.location_id = locationFilter;
      if (assetFilter) params.asset_id = assetFilter;
      if (search) params.search = search;
      if (isK3L) params.user_id = user!.user_id;
      const res = await api.get("/patrols", { params });
      return res.data as { data: Patrol[]; total: number };
    },
  });

  const patrols = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Daftar Patroli</h1>
      </div>

      {(locationFilter || assetFilter) && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-primary-50 text-primary-800 rounded-xl text-xs font-semibold border border-primary-100">
          <span>Menampilkan patroli untuk:</span>
          {locationFilter && (
            <span className="bg-white px-2.5 py-1 rounded-lg border border-primary-200 shadow-sm flex items-center gap-1.5">
              📍 Lokasi: {locationData?.name || `ID #${locationFilter}`}
              <button
                onClick={() => {
                  setLocationFilter("");
                  setSearchParams((prev) => {
                    prev.delete("location_id");
                    return prev;
                  });
                }}
                className="hover:text-red-500 font-bold ml-1"
              >
                ✕
              </button>
            </span>
          )}
          {assetFilter && (
            <span className="bg-white px-2.5 py-1 rounded-lg border border-primary-200 shadow-sm flex items-center gap-1.5">
              🛡️ Aset: {assetData?.name || `ID #${assetFilter}`}
              <button
                onClick={() => {
                  setAssetFilter("");
                  setSearchParams((prev) => {
                    prev.delete("asset_id");
                    return prev;
                  });
                }}
                className="hover:text-red-500 font-bold ml-1"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Cari patroli..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ "--tw-ring-color": theme.colors[500] } as React.CSSProperties}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["", "waiting_approval", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(0);
                setSearchParams((prev) => {
                  if (s) prev.set("status", s);
                  else prev.delete("status");
                  return prev;
                });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={
                statusFilter === s
                  ? { backgroundColor: theme.colors[500], color: "#fff" }
                  : { backgroundColor: "#f3f4f6", color: "#6b7280" }
              }
            >
              {s ? statusConfig[s]?.label : "Semua"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Memuat data...</div>
      ) : patrols.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada data patroli</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Asset</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Shift</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Tgl Kirim</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {patrols.map((p) => {
                  const cfg = statusConfig[p.status] || statusConfig.draft;
                  const Icon = cfg.icon;
                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">#{p.id}</td>
                      <td className="px-4 py-3">{assetMap?.[p.asset_id] || `Asset #${p.asset_id}`}</td>
                      <td className="px-4 py-3">{shiftMap?.[p.shift_id] ? `Shift ${shiftMap[p.shift_id]}` : `Shift #${p.shift_id}`}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {p.submitted_at ? formatDate(p.submitted_at) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/patrols/${p.id}`)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 text-white transition-all"
                          style={{ backgroundColor: theme.colors[500] }}
                        >
                          <Eye className="w-3 h-3" /> Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {total} patroli
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className="w-8 h-8 rounded-lg text-xs font-medium transition-all"
                    style={
                      i === page
                        ? { backgroundColor: theme.colors[500], color: "#fff" }
                        : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                    }
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
