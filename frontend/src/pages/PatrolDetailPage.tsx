import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/lib/theme";
import { formatDate } from "@/lib/utils";
import { useToastStore } from "@/store/toastStore";
import type { PatrolDetailResponse, PatrolDetail, HSEParameter } from "@/types";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  Save,
  Edit3,
} from "lucide-react";

const statusBadge: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-gray-600", bg: "bg-gray-100" },
  submitted: { label: "Submitted", color: "text-blue-600", bg: "bg-blue-100" },
  waiting_approval: { label: "Menunggu Persetujuan", color: "text-yellow-600", bg: "bg-yellow-100" },
  approved: { label: "Disetujui", color: "text-green-600", bg: "bg-green-100" },
  rejected: { label: "Ditolak", color: "text-red-600", bg: "bg-red-100" },
};

export function PatrolDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const theme = useThemeStore((s) => s.theme);
  const addToast = useToastStore((s) => s.addToast);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const [ghostMode, setGhostMode] = useState(false);
  const [ghostDetails, setGhostDetails] = useState<Record<number, string>>({});

  const fromScan = searchParams.get("from") === "scan";
  const isTimHse = user?.role === "TIM_HSE";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const canApprove = isSuperAdmin || (isTimHse && fromScan);

  const { data, isLoading } = useQuery({
    queryKey: ["patrol", id],
    queryFn: async () => {
      const res = await api.get(`/patrols/${id}`);
      return res.data as PatrolDetailResponse;
    },
    enabled: !!id,
  });

  const { data: paramMap } = useQuery({
    queryKey: ["all-parameters"],
    queryFn: async () => {
      const res = await api.get("/parameters");
      const params = res.data as HSEParameter[];
      const map: Record<number, HSEParameter> = {};
      for (const p of params) map[p.id] = p;
      return map;
    },
  });

  const handleApprove = async () => {
    setActionLoading("approve");
    try {
      await api.put(`/patrols/${id}/approve`);
      queryClient.invalidateQueries({ queryKey: ["patrol", id] });
      queryClient.invalidateQueries({ queryKey: ["patrols"] });
      addToast("Patroli berhasil disetujui", "success");
    } catch (err: any) {
      addToast(err.response?.data?.error || "Gagal menyetujui patroli", "error");
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading("reject");
    try {
      await api.put(`/patrols/${id}/reject`, { reason: rejectReason });
      queryClient.invalidateQueries({ queryKey: ["patrol", id] });
      queryClient.invalidateQueries({ queryKey: ["patrols"] });
      setShowReject(false);
      addToast("Patroli ditolak", "success");
    } catch (err: any) {
      addToast(err.response?.data?.error || "Gagal menolak patroli", "error");
    } finally {
      setActionLoading("");
    }
  };

  const handleGhostSave = async () => {
    setActionLoading("ghost");
    try {
      const details = (data?.details || [])
        .filter((d) => ghostDetails[d.id] !== undefined)
        .map((d) => ({
          id: d.id,
          patrol_id: d.patrol_id,
          hse_parameter_id: d.hse_parameter_id,
          value: ghostDetails[d.id] ?? d.value,
          is_anomaly: d.is_anomaly,
          notes: d.notes,
        }));
      if (details.length === 0) return;
      await api.put(`/patrols/${id}/ghost-edit`, { details });
      queryClient.invalidateQueries({ queryKey: ["patrol", id] });
      setGhostMode(false);
      setGhostDetails({});
      addToast("Ghost edit berhasil disimpan", "success");
    } catch (err: any) {
      addToast(err.response?.data?.error || "Gagal ghost edit", "error");
    } finally {
      setActionLoading("");
    }
  };

  const enterGhostMode = () => {
    const vals: Record<number, string> = {};
    for (const d of data?.details || []) {
      vals[d.id] = d.value;
    }
    setGhostDetails(vals);
    setGhostMode(true);
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Memuat data patroli...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">Patroli tidak ditemukan</div>;
  }

  const patrol = data.patrol;
  const details = data.details ?? [];
  const attachments = data.attachments ?? [];
  const badge = statusBadge[patrol.status] || statusBadge.draft;
  const isWaiting = patrol.status === "waiting_approval";
  const isRejected = patrol.status === "rejected";

  const getParamName = (paramId: number) => paramMap?.[paramId]?.parameter_name || `Parameter #${paramId}`;
  const getParamInputType = (paramId: number) => paramMap?.[paramId]?.input_type;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Patroli #{patrol.id}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {patrol.submitted_at ? formatDate(patrol.submitted_at) : "-"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(isSuperAdmin || isTimHse) && !ghostMode && (
              <button
                onClick={enterGhostMode}
                className="px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 text-gray-600 bg-gray-100 hover:bg-gray-200"
              >
                <Edit3 className="w-3 h-3" /> Ghost Edit
              </button>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.color}`}>
              {badge.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
          <div><span className="text-gray-500">Asset ID:</span> <span className="font-medium">{patrol.asset_id}</span></div>
          <div><span className="text-gray-500">Shift ID:</span> <span className="font-medium">{patrol.shift_id}</span></div>
          <div className="col-span-1 sm:col-span-2">
            <span className="text-gray-500">Client UUID:</span>
            <span className="font-mono text-xs ml-2 break-all">{patrol.client_uuid}</span>
          </div>
          {isRejected && patrol.rejection_reason && (
            <div className="col-span-1 sm:col-span-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <strong>Alasan ditolak:</strong> {patrol.rejection_reason}
            </div>
          )}
        </div>
      </div>

      {details.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" /> Hasil Inspeksi
          </h2>
          <div className="space-y-3">
            {details.map((d: PatrolDetail) => {
              const inputType = getParamInputType(d.hse_parameter_id);
              const isBool = inputType === "boolean";
              return (
                <div
                  key={d.id}
                  className={`p-4 rounded-xl border ${d.is_anomaly ? "border-red-200 bg-red-50" : "border-gray-100"}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-sm text-gray-900">
                      {getParamName(d.hse_parameter_id)}
                    </span>
                    {d.is_anomaly && (
                      <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" /> Anomali
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {ghostMode && isBool ? (
                      <select
                        value={ghostDetails[d.id] ?? d.value}
                        onChange={(e) => setGhostDetails((prev) => ({ ...prev, [d.id]: e.target.value }))}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                        style={{ "--tw-ring-color": theme.colors[500] } as React.CSSProperties}
                      >
                        <option value="O">O</option>
                        <option value="X">X</option>
                        <option value="N/A">N/A</option>
                      </select>
                    ) : ghostMode ? (
                      <input
                        type="text"
                        value={ghostDetails[d.id] ?? d.value}
                        onChange={(e) => setGhostDetails((prev) => ({ ...prev, [d.id]: e.target.value }))}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                        style={{ "--tw-ring-color": theme.colors[500] } as React.CSSProperties}
                      />
                    ) : isBool ? (
                      <span className={`text-sm font-medium ${d.value === "O" || d.value === "Ya" ? "text-green-600" : d.value === "X" || d.value === "Tidak" ? "text-red-600" : "text-gray-500"}`}>
                        {d.value || "-"}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-700">{d.value || "-"}</span>
                    )}
                  </div>
                  {d.notes && <p className="text-xs text-gray-400 mt-1">{d.notes}</p>}
                </div>
              );
            })}
          </div>

          {ghostMode && (
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={handleGhostSave}
                disabled={actionLoading === "ghost"}
                className="px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-1 text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: theme.colors[500] }}
              >
                {actionLoading === "ghost" ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Simpan Ghost Edit
              </button>
              <button
                onClick={() => { setGhostMode(false); setGhostDetails({}); }}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      )}

      {attachments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Lampiran Foto Bukti
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {attachments.map((att) => (
              <div key={att.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                <img
                  src={att.file_path}
                  alt="Lampiran foto bukti"
                  className="w-full h-48 object-cover rounded-xl border border-gray-200"
                />
                <span className="text-[10px] text-gray-400 truncate">{att.file_path}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {canApprove && isWaiting && !ghostMode && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Persetujuan</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={handleApprove}
              disabled={actionLoading === "approve"}
              className="px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 text-white transition-all"
              style={{ backgroundColor: "#16a34a" }}
            >
              {actionLoading === "approve" ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Setujui
            </button>
            <button
              onClick={() => setShowReject(!showReject)}
              disabled={actionLoading === "reject"}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Tolak
            </button>
          </div>

          {showReject && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100 space-y-3">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Alasan penolakan..."
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading === "reject"}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading === "reject" ? "Memproses..." : "Konfirmasi Tolak"}
                </button>
                <button
                  onClick={() => { setShowReject(false); setRejectReason(""); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
