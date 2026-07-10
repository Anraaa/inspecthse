import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Patrol, Asset, Shift } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/lib/theme";
import { formatDate } from "@/lib/utils";
import { Pagination } from "@/components/Pagination";
import { ClipboardCheck, Clock, CheckCircle, XCircle, Eye, Search, Calendar, Trash2 } from "lucide-react";

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
  const [dateFrom, setDateFrom] = useState(searchParams.get("date_from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("date_to") || "");
  const [page, setPage] = useState(0);
  const limit = 15;

  const isK3L = user?.role === "K3L";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const queryClient = useQueryClient();

  const handleDelete = async (id: number) => {
    if (!confirm(`Yakin hapus patroli #${id}? Data tidak bisa dikembalikan.`)) return;
    try {
      await api.delete(`/patrols/${id}`);
      queryClient.invalidateQueries({ queryKey: ["patrols"] });
    } catch (err: any) {
      alert(err.response?.data?.error || "Gagal menghapus patroli");
    }
  };

  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "");
    setLocationFilter(searchParams.get("location_id") || "");
    setAssetFilter(searchParams.get("asset_id") || "");
    setDateFrom(searchParams.get("date_from") || "");
    setDateTo(searchParams.get("date_to") || "");
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
    queryKey: ["patrols", statusFilter, locationFilter, assetFilter, search, dateFrom, dateTo, page, user?.user_id],
    queryFn: async () => {
      const params: Record<string, any> = { limit, offset: page * limit };
      if (statusFilter) params.status = statusFilter;
      if (locationFilter) params.location_id = locationFilter;
      if (assetFilter) params.asset_id = assetFilter;
      if (search) params.search = search;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (isK3L) params.user_id = user!.user_id;
      const res = await api.get("/patrols", { params });
      return res.data as { data: Patrol[]; total: number };
    },
  });

  const patrols = data?.data || [];
  const total = data?.total || 0;

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
                    setPage(0);
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
                    setPage(0);
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

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 max-w-none sm:max-w-xs w-full sm:w-auto">
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
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
            className="px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all min-w-0 w-[130px] sm:w-auto"
            style={{ "--tw-ring-color": theme.colors[500] } as React.CSSProperties}
          />
          <span className="text-gray-400 shrink-0">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
            className="px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all min-w-0 w-[130px] sm:w-auto"
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
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {patrols.map((p) => {
              const cfg = statusConfig[p.status] || statusConfig.draft;
              const Icon = cfg.icon;
              return (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-gray-400">#{p.id}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {assetMap?.[p.asset_id] || `Asset #${p.asset_id}`}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{shiftMap?.[p.shift_id] ? `Shift ${shiftMap[p.shift_id]}` : `Shift #${p.shift_id}`}</span>
                    <span>{p.submitted_at ? formatDate(p.submitted_at) : "-"}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => navigate(`/patrols/${p.id}`)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1 text-white transition-all"
                      style={{ backgroundColor: theme.colors[500] }}
                    >
                      <Eye className="w-3 h-3" /> Detail
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">ID</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Asset</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Shift</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Tgl Kirim</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {patrols.map((p) => {
                    const cfg = statusConfig[p.status] || statusConfig.draft;
                    const Icon = cfg.icon;
                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">#{p.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{assetMap?.[p.asset_id] || `Asset #${p.asset_id}`}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{shiftMap?.[p.shift_id] ? `Shift ${shiftMap[p.shift_id]}` : `Shift #${p.shift_id}`}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {p.submitted_at ? formatDate(p.submitted_at) : "-"}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => navigate(`/patrols/${p.id}`)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 text-white transition-all"
                              style={{ backgroundColor: theme.colors[500] }}
                            >
                              <Eye className="w-3 h-3" /> Detail
                            </button>
                            {isSuperAdmin && (
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination offset={page * limit} limit={limit} total={total} onPage={(o) => setPage(Math.floor(o / limit))} />
        </>
      )}
    </div>
  );
}
