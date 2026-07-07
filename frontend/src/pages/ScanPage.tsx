import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { Camera } from "lucide-react";

export function ScanPage() {
  const { qrCode } = useParams();
  const [searchParams] = useSearchParams();
  const qrFromParam = searchParams.get("qrcode");
  const qr = qrCode || qrFromParam;
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [inputCode, setInputCode] = useState("");

  const { data: scanResult, isLoading } = useQuery({
    queryKey: ["scan", qr],
    queryFn: async () => {
      const res = await api.get(`/scan/${qr}`);
      return res.data;
    },
    enabled: !!qr,
    retry: false,
  });

  useEffect(() => {
    if (scanResult) {
      const handleRouting = async () => {
        if (scanResult.type === "asset") {
          const asset = scanResult.data;
          if (user?.role === "K3L") {
            navigate(`/inspeksi-lapangan?asset_id=${asset.id}`);
          } else {
            try {
              const res = await api.get("/patrols", {
                params: { asset_id: asset.id, status: "waiting_approval", limit: 1 }
              });
              const pendingPatrols = res.data?.data || [];
              if (pendingPatrols.length > 0) {
                navigate(`/patrols/${pendingPatrols[0].id}`);
              } else {
                navigate(`/inspeksi-asset/${asset.id}`);
              }
            } catch (err) {
              navigate(`/inspeksi-asset/${asset.id}`);
            }
          }
        }
      };

      handleRouting();
    }
  }, [scanResult, navigate, user]);

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputCode.trim()) {
      navigate(`/scan/${inputCode.trim()}`);
    }
  };

  if (qr && isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Memuat data aset...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border p-6 text-center">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Scan QR Code</h1>
        <p className="text-sm text-gray-500 mb-6">
          Arahkan kamera ke QR Code aset untuk memulai inspeksi
        </p>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Atau masukkan kode QR manual"
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            Cari
          </button>
        </form>
      </div>
    </div>
  );
}
