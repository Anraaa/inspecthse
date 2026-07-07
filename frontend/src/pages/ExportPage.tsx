import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { useThemeStore } from "@/lib/theme";
import {
  FileSpreadsheet,
  Upload,
  Download,
  History,
  FileDown,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2,
  FileUp,
} from "lucide-react";

interface ExportHistoryItem {
  id: string;
  timestamp: string;
  year: string;
  category: string;
  location: string;
  section: string;
  status: "Sukses" | "Gagal";
}

interface LocationItem {
  id: number;
  name: string;
}

interface SectionItem {
  id: number;
  name: string;
}

interface ImportError {
  row: number;
  field: string;
  value: string;
  error: string;
}

interface ImportResult {
  Success: number;
  Errors: ImportError[];
}

export function ExportPage() {
  const theme = useThemeStore((s) => s.theme);
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");

  // Export States
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [category, setCategory] = useState("APAR");
  const [locationID, setLocationID] = useState("");
  const [sectionID, setSectionID] = useState("");
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);

  // Import States
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState("");

  // Fetch Locations & Sections for dropdowns
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [locRes, secRes] = await Promise.all([
          api.get("/locations"),
          api.get("/sections"),
        ]);
        
        const locList = Array.isArray(locRes.data) ? locRes.data : locRes.data?.data || [];
        const secList = Array.isArray(secRes.data) ? secRes.data : secRes.data?.data || [];
        
        setLocations(locList);
        setSections(secList);
      } catch (err) {
        console.error("Gagal memuat data referensi", err);
      }
    };
    fetchReferences();

    // Load export history from LocalStorage
    try {
      const savedHistory = localStorage.getItem("inspecthse_export_history");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch asset count whenever filters change
  useEffect(() => {
    if (!category) return;
    const fetchCount = async () => {
      setLoadingPreview(true);
      try {
        const res = await api.get("/assets", {
          params: {
            category,
            location_id: locationID || undefined,
            section_id: sectionID || undefined,
            limit: 1,
          },
        });
        setPreviewCount(res.data.total ?? 0);
      } catch (err) {
        console.error(err);
        setPreviewCount(null);
      } finally {
        setLoadingPreview(false);
      }
    };

    fetchCount();
  }, [category, locationID, sectionID]);

  // Handle Export Download
  const handleExport = async () => {
    setExporting(true);
    setExportProgress(10);
    
    // Smooth progress simulation
    const interval = setInterval(() => {
      setExportProgress((p) => (p < 85 ? p + 8 : p));
    }, 200);

    try {
      const res = await api.get("/export/checksheet", {
        params: {
          year,
          category,
          location_id: locationID || undefined,
          section_id: sectionID || undefined,
        },
        responseType: "blob",
      });

      clearInterval(interval);
      setExportProgress(100);

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `checksheet-${category}-${year}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      // Save to history
      const selectedLocName = locations.find((l) => l.id.toString() === locationID)?.name || "Semua Lokasi";
      const selectedSecName = sections.find((s) => s.id.toString() === sectionID)?.name || "Semua Section";

      const newHistoryItem: ExportHistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString("id-ID"),
        year,
        category,
        location: selectedLocName,
        section: selectedSecName,
        status: "Sukses",
      };

      const updatedHistory = [newHistoryItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem("inspecthse_export_history", JSON.stringify(updatedHistory));
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      alert("Gagal mengunduh berkas checksheet.");
      
      const selectedLocName = locations.find((l) => l.id.toString() === locationID)?.name || "Semua Lokasi";
      const selectedSecName = sections.find((s) => s.id.toString() === sectionID)?.name || "Semua Section";
      
      const newHistoryItem: ExportHistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString("id-ID"),
        year,
        category,
        location: selectedLocName,
        section: selectedSecName,
        status: "Gagal",
      };

      const updatedHistory = [newHistoryItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem("inspecthse_export_history", JSON.stringify(updatedHistory));
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
      }, 500);
    }
  };

  const clearHistory = () => {
    if (confirm("Hapus seluruh riwayat export?")) {
      setHistory([]);
      localStorage.removeItem("inspecthse_export_history");
    }
  };

  // Drag and Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setImportResult(null);
    setImportError("");

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportResult(null);
    setImportError("");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "xlsx") {
      setImportError("Format berkas tidak valid. Harap unggah berkas bertipe Excel (.xlsx)");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  // Handle Import Submit
  const handleImportSubmit = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setImportProgress(15);

    const progressInterval = setInterval(() => {
      setImportProgress((p) => (p < 90 ? p + 10 : p));
    }, 150);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await api.post("/import/assets", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(res.data);
      setSelectedFile(null);
    } catch (err: any) {
      clearInterval(progressInterval);
      const errMsg = err.response?.data?.message || err.message || "Gagal mengunggah dan memproses berkas Excel.";
      setImportError(errMsg);
    } finally {
      setTimeout(() => {
        setImporting(false);
        setImportProgress(0);
      }, 500);
    }
  };

  // Download Failed Import Rows as CSV
  const downloadErrorsAsCSV = (errors: ImportError[]) => {
    const csvHeader = "\uFEFFBaris,Kolom,Nilai,Error\n";
    const csvRows = errors
      .map(
        (e) =>
          `${e.row},"${(e.field || "").replace(/"/g, '""')}","${(e.value || "").replace(/"/g, '""')}","${(e.error || "").replace(/"/g, '""')}"`
      )
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `import_errors_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Export & Import HSE</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola data dan checksheet tahunan K3L PT. INSPECT HSE melalui utilitas impor/ekspor berkas Excel.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "export"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor Checksheet
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "import"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Upload className="w-4 h-4" />
            Impor Aset
          </button>
        </div>
      </div>

      {activeTab === "export" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Export Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
              <h3 className="text-lg font-bold text-gray-900">Parameter Filter Checksheet</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tahun</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2"
                    style={{ "--tw-ring-color": theme.colors[500] } as React.CSSProperties}
                  >
                    {[...Array(6)].map((_, i) => {
                      const yr = (new Date().getFullYear() - 3 + i).toString();
                      return <option key={yr} value={yr}>{yr}</option>;
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kategori Aset</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2"
                    style={{ "--tw-ring-color": theme.colors[500] } as React.CSSProperties}
                  >
                    <option value="APAR">APAR</option>
                    <option value="HYDRANT">Hydrant</option>
                    <option value="FIRE_ALARM">Fire Alarm (FA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Lokasi Aset</label>
                  <select
                    value={locationID}
                    onChange={(e) => setLocationID(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2"
                    style={{ "--tw-ring-color": theme.colors[500] } as React.CSSProperties}
                  >
                    <option value="">Semua Lokasi</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id.toString()}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Section Aset</label>
                  <select
                    value={sectionID}
                    onChange={(e) => setSectionID(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2"
                    style={{ "--tw-ring-color": theme.colors[500] } as React.CSSProperties}
                  >
                    <option value="">Semua Section</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id.toString()}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Count Preview */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 font-semibold block uppercase">Preview Ekspor</span>
                  <span className="text-sm text-gray-700 font-medium">
                    {loadingPreview ? (
                      <span className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menghitung data aset...
                      </span>
                    ) : previewCount !== null ? (
                      <>Terdeteksi <strong className="text-gray-900">{previewCount}</strong> aset untuk kriteria ekspor ini.</>
                    ) : (
                      "Gagal mendeteksi jumlah data."
                    )}
                  </span>
                </div>
                {previewCount !== null && (
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                    style={{ backgroundColor: theme.colors[500] }}
                  >
                    {category}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {exporting && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-600">
                    <span>Mengekspor data...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-200"
                      style={{ width: `${exportProgress}%`, backgroundColor: theme.colors[500] }}
                    />
                  </div>
                </div>
              )}

              <button
                disabled={exporting || previewCount === 0}
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: theme.colors[500] }}
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menyiapkan Excel...
                  </>
                ) : (
                  <>
                    <FileDown className="w-5 h-5" />
                    Unduh Checksheet Excel
                  </>
                )}
              </button>
            </div>
          </div>

          {/* History Exports Sidebar */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 flex flex-col h-fit">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                Riwayat Ekspor
              </h3>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>
              )}
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Belum ada riwayat unduhan ekspor checksheet.
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1.5 relative group">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-gray-800">{item.category} ({item.year})</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          item.status === "Sukses"
                            ? "bg-green-50 text-green-600 border border-green-100"
                            : "bg-red-50 text-red-600 border border-red-100"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="text-gray-500 leading-normal">
                      <p>Lokasi: <span className="text-gray-700">{item.location}</span></p>
                      <p>Section: <span className="text-gray-700">{item.section}</span></p>
                    </div>
                    <div className="text-[10px] text-gray-400 text-right pt-1">{item.timestamp}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Import Tab */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-gray-900">Unggah Berkas Master Data Aset</h3>

            {/* Drag & Drop zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center transition-all ${
                dragActive
                  ? "border-primary-500 bg-primary-50/10 scale-[0.99]"
                  : "border-gray-200 hover:border-gray-300 bg-gray-50/40"
              }`}
              style={dragActive ? ({ borderColor: theme.colors[500] } as React.CSSProperties) : {}}
            >
              <input
                id="file-upload"
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileSelect}
              />
              
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white mb-4"
                style={{ background: `linear-gradient(135deg, ${theme.colors[500]}, ${theme.colors[400]})` }}
              >
                <FileUp className="w-7 h-7" />
              </div>

              <p className="text-base font-bold text-gray-800">
                {selectedFile ? selectedFile.name : "Tarik & Lepas berkas Excel di sini"}
              </p>
              
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Hanya menerima format file Excel (.xlsx) dengan ukuran maksimal 10MB.
              </p>

              <label
                htmlFor="file-upload"
                className="px-4 py-2 rounded-xl text-sm font-bold text-white cursor-pointer hover:opacity-95 shadow"
                style={{ backgroundColor: theme.colors[500] }}
              >
                Pilih Berkas Excel
              </label>
            </div>

            {/* Error Message */}
            {importError && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Kesalahan Validasi File</span>
                  <span className="text-sm">{importError}</span>
                </div>
              </div>
            )}

            {/* Upload File Button */}
            {selectedFile && !importing && (
              <button
                onClick={handleImportSubmit}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white shadow-md hover:opacity-95 transition-all"
                style={{ backgroundColor: theme.colors[500] }}
              >
                Mulai Validasi & Import
              </button>
            )}

            {/* Import Progress Bar */}
            {importing && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>Memproses dan mengimpor data aset...</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-200"
                    style={{ width: `${importProgress}%`, backgroundColor: theme.colors[500] }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Import Results Box */}
          {importResult && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Hasil Pemrosesan Impor
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Data selesai dianalisis. Total aset berhasil ditambahkan: <strong className="text-green-600">{importResult.Success}</strong>
                  </p>
                </div>

                {importResult.Errors.length > 0 && (
                  <button
                    onClick={() => downloadErrorsAsCSV(importResult.Errors)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors border border-gray-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Log Kesalahan (CSV)
                  </button>
                )}
              </div>

              {/* Status Header */}
              {importResult.Errors.length === 0 ? (
                <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Impor Berhasil Sepenuhnya</span>
                    <span className="text-sm">Seluruh data aset ({importResult.Success} baris) berhasil disimpan tanpa ada kesalahan.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-100 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Impor Selesai dengan Beberapa Kesalahan</span>
                      <span className="text-sm">
                        Berhasil mengimpor {importResult.Success} aset. Namun terdapat {importResult.Errors.length} baris data yang ditolak karena tidak lolos validasi.
                      </span>
                    </div>
                  </div>

                  {/* Errors Table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto max-h-[300px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-100 font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 border-r border-gray-200">Baris</th>
                            <th className="px-4 py-3 border-r border-gray-200">Kolom/Field</th>
                            <th className="px-4 py-3 border-r border-gray-200">Nilai Input</th>
                            <th className="px-4 py-3">Deskripsi Error</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-700">
                          {importResult.Errors.map((err, idx) => (
                            <tr key={idx} className="hover:bg-red-50/10">
                              <td className="px-4 py-2.5 font-semibold text-center border-r border-gray-200 bg-gray-50">{err.row}</td>
                              <td className="px-4 py-2.5 font-bold text-red-600 border-r border-gray-200">{err.field}</td>
                              <td className="px-4 py-2.5 italic border-r border-gray-200 bg-gray-50/40">{err.value || "-"}</td>
                              <td className="px-4 py-2.5 text-gray-600 font-medium">{err.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
