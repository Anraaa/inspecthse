import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCheck, Bell } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useNotificationStore } from "@/store/notificationStore";

export function NotificationPage() {
  const navigate = useNavigate();
  const { alerts, total, loading, loadAlerts, markAsRead, markAllAsRead } = useNotificationStore();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    loadAlerts({ limit: 50 });
  }, [loadAlerts]);

  const handleFilterChange = (f: "all" | "unread") => {
    setFilter(f);
    loadAlerts({ is_read: f === "unread" ? false : undefined, limit: 50 });
  };

  const handleClick = async (alert: typeof alerts[0]) => {
    if (!alert.is_read) {
      await markAsRead(alert.id);
    }
    if (alert.patrol_id) {
      navigate(`/patrols/${alert.patrol_id}`);
    }
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} notifikasi ({unreadCount} belum dibaca)
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleFilterChange("all")}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
            filter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
          )}
        >
          Semua
        </button>
        <button
          onClick={() => handleFilterChange("unread")}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
            filter === "unread" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
          )}
        >
          Belum Dibaca
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Memuat notifikasi...</div>
        ) : alerts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Tidak ada notifikasi</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <button
              key={alert.id}
              onClick={() => handleClick(alert)}
              className={cn(
                "w-full text-left px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-start gap-3",
                !alert.is_read && "bg-blue-50/30",
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                  alert.is_read ? "bg-transparent" : "bg-blue-500",
                )}
              />
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", !alert.is_read ? "font-medium text-gray-900" : "text-gray-600")}>
                  {alert.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(alert.created_at)}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
