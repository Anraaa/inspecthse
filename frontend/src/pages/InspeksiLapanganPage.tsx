import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Asset, HSEParameter, Shift } from "@/types";
import { AlertTriangle, Send, CheckCircle, ArrowLeft, Building, ClipboardCheck } from "lucide-react";

interface FormEntry {
  hse_parameter_id: number;
  value: string;
  is_anomaly: boolean;
  notes: string;
}

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface Location {
  id: number;
  name: string;
  description: string;
  qr_code?: string | null;
}

export function InspeksiLapanganPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assetId = searchParams.get("asset_id");
  const locationId = searchParams.get("location_id");

  const [shiftId, setShiftId] = useState<number | "">("");
  const [formValues, setFormValues] = useState<Record<string, FormEntry>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // 1. Fetch single asset (if asset_id is present)
  const { data: singleAsset, isLoading: assetLoading } = useQuery({
    queryKey: ["asset-by-id", assetId],
    queryFn: async () => {
      const res = await api.get(`/assets/${assetId}`);
      return res.data as Asset;
    },
    enabled: !!assetId,
  });

  // 2. Fetch location info (if location_id is present)
  const { data: location, isLoading: locationLoading } = useQuery({
    queryKey: ["location-by-id", locationId],
    queryFn: async () => {
      const res = await api.get(`/locations/${locationId}`);
      return res.data as Location;
    },
    enabled: !!locationId,
  });

  // 3. Fetch assets in location (if location_id is present)
  const { data: locationAssetsRes, isLoading: locationAssetsLoading } = useQuery({
    queryKey: ["assets-by-location", locationId],
    queryFn: async () => {
      const res = await api.get("/assets", {
        params: { location_id: locationId, limit: 1000 },
      });
      return res.data;
    },
    enabled: !!locationId,
  });

  const locationAssets = useMemo(() => {
    return (locationAssetsRes?.data as Asset[]) || [];
  }, [locationAssetsRes]);

  // Unified assets list: either the single asset or all assets in the scanned location
  const assets = useMemo((): Asset[] => {
    if (singleAsset) return [singleAsset];
    return locationAssets;
  }, [singleAsset, locationAssets]);

  // 4. Fetch HSE parameters (all parameters if location scan, otherwise specific category if asset scan)
  const { data: parameters } = useQuery({
    queryKey: ["parameters", singleAsset?.asset_category],
    queryFn: async () => {
      if (singleAsset) {
        const res = await api.get("/parameters", {
          params: { category: singleAsset.asset_category },
        });
        return res.data as HSEParameter[];
      } else {
        const res = await api.get("/parameters");
        return res.data as HSEParameter[];
      }
    },
    enabled: !!singleAsset || !!locationId,
  });

  // 5. Fetch shifts
  const { data: shifts } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const res = await api.get("/shifts");
      return res.data as Shift[];
    },
  });

  // Helper to get parameters matching an asset's category
  const getParamsForCategory = useCallback(
    (category: string): HSEParameter[] => {
      if (!parameters) return [];
      return parameters.filter((p) => p.asset_category === category);
    },
    [parameters]
  );

  // Initialize form entries for all assets and their parameters
  useEffect(() => {
    if (assets.length > 0 && parameters) {
      const initialForm: Record<string, FormEntry> = {};
      for (const asset of assets) {
        const assetParams = getParamsForCategory(asset.asset_category);
        for (const p of assetParams) {
          const key = `${asset.id}-${p.id}`;
          initialForm[key] = {
            hse_parameter_id: p.id,
            value: "",
            is_anomaly: false,
            notes: "",
          };
        }
      }
      setFormValues(initialForm);
    }
  }, [assets, parameters, getParamsForCategory]);

  const updateValue = useCallback((assetId: number, paramId: number, value: string) => {
    const key = `${assetId}-${paramId}`;
    setFormValues((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
  }, []);

  const toggleAnomaly = useCallback((assetId: number, paramId: number) => {
    const key = `${assetId}-${paramId}`;
    setFormValues((prev) => ({
      ...prev,
      [key]: { ...prev[key], is_anomaly: !prev[key]?.is_anomaly },
    }));
  }, []);

  const updateNotes = useCallback((assetId: number, paramId: number, notes: string) => {
    const key = `${assetId}-${paramId}`;
    setFormValues((prev) => ({
      ...prev,
      [key]: { ...prev[key], notes },
    }));
  }, []);

  const handleSubmit = async () => {
    if (!shiftId) {
      setError("Silakan pilih shift terlebih dahulu");
      return;
    }
    if (assets.length === 0) {
      setError("Tidak ada aset untuk diinspeksi");
      return;
    }

    // Validation check: ensure all required parameters for all assets are filled
    for (const asset of assets) {
      const assetParams = getParamsForCategory(asset.asset_category);
      for (const p of assetParams) {
        if (p.is_required) {
          const key = `${asset.id}-${p.id}`;
          const val = formValues[key]?.value;
          if (val === "" || val === undefined || val === null) {
            setError(`Parameter "${p.parameter_name}" pada aset "${asset.name}" wajib diisi.`);
            return;
          }
        }
      }
    }

    setSubmitting(true);
    setError("");

    try {
      // Submit a patrol for each asset in parallel
      const submitPromises = assets.map(async (asset) => {
        const details: { hse_parameter_id: number; value: string; is_anomaly: boolean; notes: string }[] = [];
        const assetParams = getParamsForCategory(asset.asset_category);

        for (const p of assetParams) {
          const key = `${asset.id}-${p.id}`;
          const entry = formValues[key];
          if (entry && entry.value !== "" && entry.value !== undefined && entry.value !== null) {
            details.push({
              hse_parameter_id: p.id,
              value: entry.value,
              is_anomaly: entry.is_anomaly,
              notes: entry.notes,
            });
          }
        }

        // Only submit if at least one parameter was filled
        if (details.length > 0) {
          await api.post("/patrols", {
            asset_id: asset.id,
            shift_id: shiftId,
            client_uuid: uuidv4(),
            details,
            attachments: [],
          });
        }
      });

      await Promise.all(submitPromises);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal mengirim data inspeksi");
    } finally {
      setSubmitting(false);
    }
  };

  const getBadgeStyle = (category: string) => {
    switch (category) {
      case "APAR":
        return "bg-cyan-50 text-cyan-700 border-cyan-100";
      case "HYDRANT":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "FIRE_ALARM":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  const isLoading = assetLoading || locationLoading || locationAssetsLoading;

  if (!assetId && !locationId) {
    return (
      <div className="p-4 text-center text-gray-500 min-h-[300px] flex items-center justify-center">
        <div>
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">Silakan scan QR code aset atau lokasi terlebih dahulu</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">Memuat data inspeksi...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center animate-in fade-in min-h-[80vh] flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 w-full">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inspeksi Berhasil!</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Data checklist patroli untuk {locationId ? `Lokasi "${location?.name}"` : `Aset "${singleAsset?.name}"`} telah berhasil disimpan dan diserahkan ke sistem.
          </p>
          <button
            onClick={() => navigate("/patrols")}
            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-primary-500/20"
          >
            Lihat Riwayat Patroli
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto pb-32">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      {/* Scrollable Header & Shift Container for Mobile */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-2 -mx-4 px-4 scrollbar-none snap-x snap-mandatory lg:flex-col lg:overflow-x-visible lg:pb-0 lg:mb-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* Main Header Card */}
        <div className="w-[88vw] sm:w-[360px] flex-shrink-0 snap-start lg:w-full">
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4">
                {locationId ? (
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/50">
                    <Building className="w-7 h-7" />
                  </div>
                ) : (
                  <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl border border-cyan-100/50">
                    <ClipboardCheck className="w-7 h-7" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-black text-gray-900 tracking-tight">
                    Form Inspeksi {locationId ? "Lokasi" : "Aset"}
                  </h1>
                  <p className="text-xs text-gray-400 font-medium">
                    Sistem Manajemen Inspeksi K3L & HSE
                  </p>
                </div>
              </div>

              {locationId && location && (
                <div className="mt-5 pt-4 border-t border-gray-100/70 grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <p className="text-gray-400 font-medium mb-0.5">Nama Lokasi</p>
                    <p className="font-bold text-gray-800 text-sm">{location.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium mb-0.5">Jumlah Aset</p>
                    <p className="font-bold text-emerald-600 text-sm">{assets.length} Aset</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400 font-medium mb-0.5">Deskripsi Lokasi</p>
                    <p className="font-medium text-gray-600 leading-relaxed truncate">{location.description || "-"}</p>
                  </div>
                </div>
              )}

              {assetId && singleAsset && (
                <div className="mt-5 pt-4 border-t border-gray-100/70 grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <p className="text-gray-400 font-medium mb-0.5">Nama Aset</p>
                    <p className="font-bold text-gray-800 text-sm">{singleAsset.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium mb-0.5">Kategori</p>
                    <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase border rounded-full mt-0.5 ${getBadgeStyle(singleAsset.asset_category)}`}>
                      {singleAsset.asset_category}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium mb-0.5">Serial Number</p>
                    <p className="font-bold text-gray-800">{singleAsset.serial_number || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium mb-0.5">Kode QR</p>
                    <p className="font-mono text-gray-600">{singleAsset.qr_code}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shift Selector */}
        <div className="w-[88vw] sm:w-[360px] flex-shrink-0 snap-start lg:w-full">
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 p-6 h-full flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Pilih Shift Kerja</label>
              <div className="grid grid-cols-1 gap-2">
                {shifts?.map((s) => {
                  const isSelected = shiftId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setShiftId(s.id)}
                      className={`px-4 py-2.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "bg-primary-50 border-primary-300 ring-2 ring-primary-100"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-wider ${isSelected ? "text-primary-700" : "text-gray-400"}`}>
                            Shift {s.name}
                          </p>
                          <p className={`text-[11px] font-medium mt-0.5 ${isSelected ? "text-primary-600" : "text-gray-500"}`}>
                            {s.start_time} - {s.end_time}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Checklist Cards per Asset */}
      {assets.map((asset) => {
        const assetParams = getParamsForCategory(asset.asset_category);
        return (
          <div key={asset.id} className="bg-white rounded-3xl shadow-xl shadow-gray-100/30 border border-gray-100 p-6 mb-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h3 className="font-black text-gray-900 text-lg">{asset.name}</h3>
                <p className="text-xs font-semibold text-gray-400 mt-1">
                  SN: {asset.serial_number || "-"}
                </p>
              </div>
              <span className={`px-3 py-1 text-[10px] font-black uppercase border rounded-full ${getBadgeStyle(asset.asset_category)}`}>
                {asset.asset_category}
              </span>
            </div>

            {assetParams.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Tidak ada parameter HSE untuk kategori aset ini.</p>
            ) : (
              assetParams.map((param) => {
                const key = `${asset.id}-${param.id}`;
                const entry = formValues[key] || { value: "", is_anomaly: false, notes: "" };
                return (
                  <div
                    key={param.id}
                    className={`bg-gray-50/50 rounded-2xl border p-4 mb-4 transition-all ${
                      entry.is_anomaly ? "border-red-300 bg-red-50/10 ring-2 ring-red-100" : "border-gray-100"
                    }`}
                  >
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-gray-200/60 text-gray-600 rounded-md uppercase tracking-wider">
                          {param.check_type}
                        </span>
                        {param.unit && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-primary-50 text-primary-700 font-bold rounded-md">
                            Satuan: {param.unit}
                          </span>
                        )}
                      </div>
                      <label className="block text-sm font-bold text-gray-800 mt-2 leading-relaxed">
                        {param.parameter_name}
                        {param.is_required && <span className="text-red-500 ml-1 font-black">*</span>}
                      </label>
                    </div>

                    {/* Inputs based on type */}
                    {param.input_type === "boolean" && (
                      <div className="flex gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => updateValue(asset.id, param.id, "Ya")}
                          className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${
                            entry.value === "Ya"
                              ? "bg-green-600 border-green-600 text-white shadow-md shadow-green-500/20"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          Ya
                        </button>
                        <button
                          type="button"
                          onClick={() => updateValue(asset.id, param.id, "Tidak")}
                          className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${
                            entry.value === "Tidak"
                              ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-500/20"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          Tidak
                        </button>
                      </div>
                    )}

                    {param.input_type === "numeric" && (
                      <input
                        type="number"
                        step="any"
                        value={entry.value}
                        onChange={(e) => updateValue(asset.id, param.id, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white transition-all font-medium"
                        placeholder={`Masukkan nilai angka${param.unit ? ` (${param.unit})` : ""}`}
                      />
                    )}

                    {param.input_type === "text" && (
                      <input
                        type="text"
                        value={entry.value}
                        onChange={(e) => updateValue(asset.id, param.id, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white transition-all font-medium"
                        placeholder="Masukkan keterangan tertulis"
                      />
                    )}

                    {param.input_type === "option" && (
                      <select
                        value={entry.value}
                        onChange={(e) => updateValue(asset.id, param.id, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white transition-all font-medium"
                      >
                        <option value="">Pilih Opsi Kriteria</option>
                        {param.options?.split(",").map((opt) => (
                          <option key={opt} value={opt.trim()}>
                            {opt.trim()}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Anomaly & Notes Section */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() => toggleAnomaly(asset.id, param.id)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all border ${
                          entry.is_anomaly
                            ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-500/20"
                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {entry.is_anomaly ? "Anomali Terdeteksi" : "Tandai Anomali"}
                      </button>

                      <input
                        type="text"
                        value={entry.notes}
                        onChange={(e) => updateNotes(asset.id, param.id, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary-500 bg-white"
                        placeholder="Catatan kendala / temuan (opsional)"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );
      })}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-xs border border-red-100 font-semibold animate-in fade-in flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Sticky Bottom Action Bar for Mobile, Static for Desktop */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] z-30 lg:static lg:bg-transparent lg:border-t-0 lg:p-0 lg:shadow-none lg:mx-0 lg:mb-0">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/10 active:scale-[0.98]"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {submitting ? "Mengirim Laporan..." : "Kirim Hasil Inspeksi"}
          </button>
        </div>
      </div>
    </div>
  );
}
