import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutDashboard,
  Scan,
  ClipboardCheck,
  Database,
  Users,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  Settings,
  Moon,
  Sun,
} from "lucide-react";
import { useThemeStore, themePresets } from "@/lib/theme";
import { useDarkMode } from "@/lib/darkMode";
import { NotificationBell } from "./NotificationBell";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "K3L", "TIM_HSE"] as const },
  { to: "/scan", label: "Scan QR", icon: Scan, roles: ["K3L", "TIM_HSE"] as const },
  { to: "/inspeksi-lapangan", label: "Inspeksi Lapangan", icon: ClipboardCheck, roles: ["K3L"] as const },
  { to: "/patrols", label: "Patroli", icon: ClipboardCheck, roles: ["K3L", "TIM_HSE", "SUPER_ADMIN"] as const },

  { to: "/sections", label: "Master Data", icon: Database, roles: ["SUPER_ADMIN"] as const },
  { to: "/users", label: "Users", icon: Users, roles: ["SUPER_ADMIN"] as const },
  { to: "/export-hse", label: "Export HSE", icon: FileSpreadsheet, roles: ["SUPER_ADMIN"] as const },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (to: string) => {
    if (to === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(to);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-50 transition-transform duration-300 lg:static lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: `linear-gradient(135deg, ${theme.colors[500]}, ${theme.colors[400]})` }}
            >
              I
            </div>
            <span className="text-xl font-bold text-gray-900">InspectHSE</span>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1 text-gray-500 hover:text-gray-900 rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems
            .filter((item) => user && (item.roles as readonly string[]).includes(user.role))
            .map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "text-white font-medium shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  )}
                  style={active ? { backgroundColor: theme.colors[500] } : {}}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors w-full px-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-lg lg:hidden focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-sm font-semibold text-gray-600 capitalize tracking-wide">
              {location.pathname === "/dashboard"
                ? "Dashboard"
                : location.pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || ""}
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all focus:outline-none"
              title={isDark ? "Mode Terang" : "Mode Gelap"}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <NotificationBell />
            <div className="relative flex items-center pr-2 sm:pr-4 border-r border-gray-100">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={cn(
                  "p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all focus:outline-none",
                  isSettingsOpen && "bg-gray-100 text-gray-900"
                )}
                title="Settings"
              >
                <Settings className={cn("w-5 h-5 transition-transform duration-300", isSettingsOpen && "rotate-45")} />
              </button>

              {isSettingsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsSettingsOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-3 px-3.5 z-40">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                      Pilih Tema
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {themePresets.map((t) => (
                        <button
                          key={t.name}
                          onClick={() => setTheme(t.name)}
                          title={t.label}
                          className="w-10 h-10 rounded-full transition-all hover:scale-110 active:scale-95 focus:outline-none flex items-center justify-center relative group"
                          style={{
                            background: `linear-gradient(135deg, ${t.colors[500]}, ${t.colors[400]})`,
                          }}
                        >
                          {theme.name === t.name ? (
                            <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-white/0 group-hover:bg-white/40 transition-colors" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: `linear-gradient(135deg, ${theme.colors[500]}, ${theme.colors[400]})` }}
              >
                {user?.email ? user.email[0].toUpperCase() : "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-xs text-gray-400 leading-tight">{user?.role?.replace(/_/g, " ") || ""}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
