import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Filter,
  Download,
  MoreHorizontal,
  ArrowUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import api from "@/lib/axios";
import type { Asset } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/lib/theme";

const patrolData = [
  { month: "Jun", value: 180 },
  { month: "Jul", value: 220 },
  { month: "Aug", value: 195 },
  { month: "Sep", value: 280 },
  { month: "Oct", value: 310 },
  { month: "Nov", value: 265 },
];

const weeklyPatrols = [
  { day: "Sun", patrols: 18 },
  { day: "Mon", patrols: 32 },
  { day: "Tue", patrols: 45 },
  { day: "Wed", patrols: 38 },
  { day: "Thu", patrols: 29 },
  { day: "Fri", patrols: 22 },
  { day: "Sat", patrols: 15 },
];

const statusData = [
  { name: "Approved", value: 145, color: "#22c55e" },
  { name: "Pending", value: 62, color: "#eab308" },
  { name: "Rejected", value: 18, color: "#ef4444" },
];

const assetCategories = [
  { name: "APAR", value: 0, color: "#6366f1" },
  { name: "HYDRANT", value: 0, color: "#8b5cf6" },
  { name: "FIRE ALARM", value: 0, color: "#06b6d4" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-3">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name || ""}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {children}
    </div>
  );
}

function getRolePath(role: string) {
  switch (role) {
    case "SUPER_ADMIN": return "super-admin";
    case "K3L": return "k3l";
    case "TIM_HSE": return "tim-hse";
    default: return "super-admin";
  }
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);
  const role = user?.role || "SUPER_ADMIN";

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard", role],
    queryFn: async () => {
      const res = await api.get(`/dashboard/${getRolePath(role)}`);
      return res.data as {
        total_patrols?: number;
        total_assets?: number;
        total_users?: number;
        user_id?: number;
        pending_approvals?: number;
      };
    },
  });

  const { data: assetsData } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await api.get("/assets", { params: { limit: 5 } });
      return res.data as { data: Asset[]; total: number };
    },
  });

  const assets = assetsData?.data || [];
  const totalAssets = stats?.total_assets ?? assetsData?.total ?? 0;
  const totalPatrols = stats?.total_patrols ?? 0;
  const totalUsers = stats?.total_users ?? 0;

  const categoryCounts = assetCategories.map((cat) => ({
    ...cat,
    value: assets.filter((a) => a.asset_category === cat.name).length || 0,
  }));
  const totalCategoryValue = categoryCounts.reduce((s, d) => s + d.value, 0) || 1;

  const gradientId = `patrolGradient-${theme.name}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            style={{ "--tw-ring-color": theme.colors[500] } as React.CSSProperties}
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-5">
            <p className="text-sm text-gray-500">Total Assets</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-3xl font-bold text-gray-900">
                {statsLoading ? "-" : totalAssets}
              </p>
              <div className="flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                <TrendingUp className="w-4 h-4" />
                +5.2%
              </div>
            </div>
          </div>
          <div
            className="h-1 rounded-b-xl"
            style={{ background: `linear-gradient(90deg, ${theme.colors[500]}, ${theme.colors[400]})` }}
          />
        </Card>

        <Card>
          <div className="p-5">
            <p className="text-sm text-gray-500">Total Patrols</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-3xl font-bold text-gray-900">
                {statsLoading ? "-" : totalPatrols}
              </p>
              <div className="flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                <TrendingUp className="w-4 h-4" />
                +12.3%
              </div>
            </div>
          </div>
          <div
            className="h-1 rounded-b-xl"
            style={{ background: `linear-gradient(90deg, ${theme.colors[400]}, ${theme.gradientTo})` }}
          />
        </Card>

        <Card>
          <div className="p-5">
            <p className="text-sm text-gray-500">Total Users</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-3xl font-bold text-gray-900">
                {statsLoading ? "-" : totalUsers}
              </p>
              <div className="flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                <TrendingUp className="w-4 h-4" />
                +3.1%
              </div>
            </div>
          </div>
          <div
            className="h-1 rounded-b-xl"
            style={{ background: `linear-gradient(90deg, ${theme.gradientTo}, #14b8a6)` }}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Patrol Activity</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900">{totalPatrols}</span>
                  <span className="flex items-center gap-0.5 text-sm font-medium text-green-600">
                    <ArrowUp className="w-3.5 h-3.5" />
                    12.3%
                  </span>
                  <span className="text-xs text-gray-400">(last 6 months)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  <Filter className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={patrolData}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.colors[500]} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={theme.colors[500]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={theme.colors[500]}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Weekly Patrols</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {weeklyPatrols.reduce((s, d) => s + d.patrols, 0)}
                  </span>
                  <span className="flex items-center gap-0.5 text-sm font-medium text-green-600">
                    <ArrowUp className="w-3.5 h-3.5" />
                    8.3%
                  </span>
                  <span className="text-xs text-gray-400">this week</span>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 text-xs text-gray-500">
                <span>Weekly</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyPatrols}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="patrols" radius={[6, 6, 0, 0]}>
                    {weeklyPatrols.map((entry) => (
                      <Cell
                        key={entry.day}
                        fill={entry.patrols === 45 ? theme.colors[500] : theme.colors[200]}
                        fillOpacity={entry.patrols === 45 ? 1 : 0.5}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Tuesday &mdash; 45 patrols (highest)
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Patrol Status</h3>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 text-xs text-gray-500">
                <span>All Time</span>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="h-56 w-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">Approved</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{statusData[0].value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-green-500"
                      style={{ width: `${(statusData[0].value / statusData.reduce((s, d) => s + d.value, 0)) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">Pending</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{statusData[1].value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-yellow-500"
                      style={{ width: `${(statusData[1].value / statusData.reduce((s, d) => s + d.value, 0)) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-gray-600">Rejected</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{statusData[2].value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-red-500"
                      style={{ width: `${(statusData[2].value / statusData.reduce((s, d) => s + d.value, 0)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Asset Categories</h3>
              <button
                className="text-sm font-medium transition-colors"
                style={{ color: theme.colors[600] }}
              >
                See All
              </button>
            </div>
            <div className="space-y-5">
              {categoryCounts.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" style={{ color: cat.color }} />
                      <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{cat.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${(cat.value / totalCategoryValue) * 100}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {assets.length > 0 && (
              <>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">Recent Assets</h4>
                  <div className="space-y-2">
                    {assets.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor:
                                asset.asset_category === "APAR"
                                  ? theme.colors[500]
                                  : asset.asset_category === "HYDRANT"
                                    ? theme.colors[400]
                                    : theme.gradientTo,
                            }}
                          />
                          <span className="text-sm text-gray-700">{asset.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">{asset.plant || "-"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
