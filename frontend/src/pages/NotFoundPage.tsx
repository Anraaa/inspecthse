import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileQuestion } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-6xl font-black text-gray-200 mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-sm text-gray-500 mb-8">
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}
