import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useNotificationStore } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";

export function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { alerts, unreadCount, loadAlerts, loadUnreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, loadUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      loadAlerts({ limit: 5 });
    }
  }, [isOpen, loadAlerts]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAlertClick = async (alert: typeof alerts[0]) => {
    if (!alert.is_read) {
      await markAsRead(alert.id);
    }
    setIsOpen(false);
    if (alert.patrol_id) {
      navigate(`/patrols/${alert.patrol_id}`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all focus:outline-none"
        title="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-96 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifikasi</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Tidak ada notifikasi
              </div>
            ) : (
              alerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors",
                    !alert.is_read && "bg-blue-50/50",
                  )}
                >
                  <p className={cn("text-sm", !alert.is_read ? "font-medium text-gray-900" : "text-gray-600")}>
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(alert.created_at)}</p>
                </button>
              ))
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-center text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-t border-gray-100 rounded-b-xl font-medium"
          >
            Lihat Semua
          </Link>
        </div>
      )}
    </div>
  );
}
