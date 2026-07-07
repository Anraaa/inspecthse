import { RefreshCw, AlertTriangle } from "lucide-react";

export function ServerErrorPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-6xl font-black text-gray-200 mb-2">500</h1>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Kesalahan Server</h2>
        <p className="text-sm text-gray-500 mb-8">
          Maaf, terjadi kesalahan pada server. Silakan coba lagi beberapa saat.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Muat Ulang Halaman
        </button>
      </div>
    </div>
  );
}
