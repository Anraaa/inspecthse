import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { formatDate } from "@/lib/utils";
import type { Asset, Patrol, Shift } from "@/types";
import { ArrowLeft, ClipboardCheck, Clock, CheckCircle, XCircle, Eye, Calendar, Shield } from "lucide-react";
import { Pagination } from "@/components/Pagination";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft: { label: "Draft", color: "text-gray-600", bg: "bg-gray-100", icon: Clock },
  submitted: { label: "Submitted", color: "text-blue-600", bg: "bg-blue-100", icon: ClipboardCheck },
  waiting_approval: { label: "Menunggu Persetujuan", color: "text-yellow-600", bg: "bg-yellow-100", icon: Clock },
  approved: { label: "Disetujui", color: "text-green-600", bg: "bg-green-100", icon: CheckCircle },
  rejected: { label: "Ditolak", color: "text-red-600", bg: "bg-red-100", icon: XCircle },
};

export function InspeksiAssetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0);
  const limit = 10;
  useEffect(() => { setOffset(0); }, [id]);
 
  // 1. Fetch asset details
  const { data: asset, isLoading: assetLoading } = useQuery({
    queryKey: ["asset-by-id", id],
    queryFn: async () => {
      const res = await api.get(`/assets/${id}`);
      return res.data as Asset;
    },
    enabled: !!id,
  });

  // 2. Fetch location details
  const { data: location } = useQuery({
    queryKey: ["location-by-id", asset?.location_id],
    queryFn: async () => {
      const res = await api.get(`/locations/${asset?.location_id}`);
      return res.data;
    },
    enabled: !!asset?.location_id,
  });

  // 3. Fetch patrol history for this asset
  const { data: patrolHistoryRes, isLoading: historyLoading } = useQuery({
    queryKey: ["patrol-history-by-asset", id, offset],
    queryFn: async () => {
      const res = await api.get("/patrols", { params: { asset_id: id, limit, offset } });
      return res.data as { data: Patrol[]; total: number };
    },
    enabled: !!id,
  });

  // 4. Fetch shifts for name lookup
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

  const patrols = patrolHistoryRes?.data || [];
  const isLoading = assetLoading || historyLoading;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">Memuat histori aset...</p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-6 text-center text-gray-500 min-h-[300px] flex items-center justify-center">
        <div>
          <p className="text-4xl mb-3">⚠️</p>
          <p className="font-medium">Aset tidak ditemukan</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto pb-32">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      {/* Asset Header Info Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 p-6 mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl border border-primary-100/50">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase border rounded-full bg-cyan-50 text-cyan-700 border-cyan-100 mb-2">
                {asset.asset_category}
              </span>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                {asset.name}
              </h1>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Serial Number: {asset.serial_number || "-"}
              </p>
            </div>
          </div>
          <div className="text-right text-xs font-medium">
            <p className="text-gray-400 font-semibold mb-1">Masa Berlaku Aset</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl font-bold">
              <Calendar className="w-3.5 h-3.5" />
              {asset.expired_at ? formatDate(asset.expired_at) : "Tidak terbatas"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100/70 text-xs">
          <div>
            <p className="text-gray-400 font-semibold mb-0.5">Lokasi</p>
            <p className="font-bold text-gray-800 text-sm">{location?.name || "-"}</p>
          </div>
          <div>
            <p className="text-gray-400 font-semibold mb-0.5">Plant</p>
            <p className="font-bold text-gray-800 text-sm">{asset.plant || "-"}</p>
          </div>
          <div>
            <p className="text-gray-400 font-semibold mb-0.5">Ukuran / Kapasitas</p>
            <p className="font-bold text-gray-800 text-sm">{asset.size || "-"}</p>
          </div>
          <div>
            <p className="text-gray-400 font-semibold mb-0.5">Status Aset</p>
            <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full ${asset.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {asset.is_active ? "Aktif" : "Non-Aktif"}
            </span>
          </div>
        </div>
      </div>

      {/* Patrol History Title */}
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        📊 Riwayat Inspeksi & Patroli
      </h2>

      {patrols.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center shadow-sm">
          <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">Belum ada riwayat inspeksi untuk aset ini.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {patrols.map((p) => {
              const cfg = statusConfig[p.status] || statusConfig.draft;
              const Icon = cfg.icon;
              const isPending = p.status === "waiting_approval";
              return (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-gray-400">#{p.id}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {shiftMap?.[p.shift_id] ? `Shift ${shiftMap[p.shift_id]}` : `Shift #${p.shift_id}`}
                  </div>
                  <div className="text-xs text-gray-400 mb-3">
                    {p.submitted_at ? formatDate(p.submitted_at) : "-"}
                  </div>
                  <button
                    onClick={() => navigate(`/patrols/${p.id}`)}
                    className={`w-full py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1 text-white transition-all ${isPending ? 'bg-amber-500 hover:bg-amber-600 animate-pulse' : 'bg-gray-500 hover:bg-gray-600'}`}
                  >
                    {isPending ? "Tinjau & Validasi" : <><Eye className="w-3 h-3" /> Detail</>}
                  </button>
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
                    const isPending = p.status === "waiting_approval";
                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">#{p.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{shiftMap?.[p.shift_id] ? `Shift ${shiftMap[p.shift_id]}` : `Shift #${p.shift_id}`}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {p.submitted_at ? formatDate(p.submitted_at) : "-"}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {isPending ? (
                            <button
                              onClick={() => navigate(`/patrols/${p.id}`)}
                              className="px-3 py-1.5 rounded-lg text-xs font-extrabold inline-flex items-center gap-1 text-white transition-all bg-amber-500 hover:bg-amber-600 animate-pulse"
                            >
                              Tinjau & Validasi
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/patrols/${p.id}`)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 text-white transition-all bg-gray-500 hover:bg-gray-600"
                            >
                              <Eye className="w-3 h-3" /> Detail
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination offset={offset} limit={limit} total={patrolHistoryRes?.total || 0} onPage={setOffset} />
        </>
      )}
    </div>
  );
}
