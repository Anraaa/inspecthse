import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCheck, Bell } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useNotificationStore } from "@/store/notificationStore";
import { Pagination } from "@/components/Pagination";

export function NotificationPage() {
  const navigate = useNavigate();
  const { alerts, total, loading, loadAlerts, markAsRead, markAllAsRead } = useNotificationStore();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadAlerts({ offset, limit });
  }, [loadAlerts, offset]);

  const handleFilterChange = (f: "all" | "unread") => {
    setFilter(f);
    setOffset(0);
    loadAlerts({ is_read: f === "unread" ? false : undefined, offset: 0, limit });
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
    <div className="-m-4 sm:m-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sm:bg-transparent sm:border-0 sm:px-0 sm:py-0 sm:mb-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Notifikasi</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {total} notifikasi ({unreadCount} belum dibaca)
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors shrink-0"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Tandai Semua Dibaca</span>
              <span className="inline sm:hidden">Baca Semua</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="px-4 sm:px-0 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleFilterChange("all")}
            className={cn(
              "flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              filter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            Semua
          </button>
          <button
            onClick={() => handleFilterChange("unread")}
            className={cn(
              "flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              filter === "unread" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            Belum Dibaca
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="px-4 sm:px-0 py-16 text-center text-sm text-gray-400">Memuat notifikasi...</div>
      ) : alerts.length === 0 ? (
        <div className="px-4 sm:px-0 py-16 text-center">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Tidak ada notifikasi</p>
        </div>
      ) : (
        <div className="sm:bg-white sm:rounded-xl sm:border sm:border-gray-100 sm:shadow-sm sm:overflow-hidden">
          {alerts.map((alert, idx) => (
            <button
              key={alert.id}
              onClick={() => handleClick(alert)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3.5 transition-colors active:bg-gray-50",
                !alert.is_read && "bg-blue-50/40",
                idx < alerts.length - 1 && "border-b border-gray-50",
              )}
            >
              <div className={cn(
                "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0",
                alert.is_read ? "bg-gray-300" : "bg-blue-500",
              )} />
              <div className="flex-1 min-w-0 text-left">
                <p className={cn(
                  "text-sm leading-snug",
                  !alert.is_read ? "font-semibold text-gray-900" : "text-gray-600",
                )}>
                  {alert.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(alert.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {total > limit && (
        <Pagination offset={offset} limit={limit} total={total} onPage={(o) => setOffset(o)} />
      )}
    </div>
  );
}
