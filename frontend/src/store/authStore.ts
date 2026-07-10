import { create } from "zustand";
import api from "@/lib/axios";
import type { Role, Permission } from "@/types";

interface User {
  user_id: number;
  nip: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  permissions: string[];
  login: (nip: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
  fetchPermissions: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
}

function decodeJWT(token: string): User | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return {
      user_id: decoded.user_id,
      nip: decoded.nip,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

function loadTokens(): { access: string | null; refresh: string | null } {
  return {
    access: localStorage.getItem("access_token"),
    refresh: localStorage.getItem("refresh_token"),
  };
}

const initialUser = (() => {
  const { access } = loadTokens();
  return access ? decodeJWT(access) : null;
})();

function initPermissions(): string[] {
  const cached = localStorage.getItem("user_permissions");
  if (cached) {
    try { return JSON.parse(cached); } catch { }
  }
  return [];
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  accessToken: loadTokens().access,
  refreshToken: loadTokens().refresh,
  isAuthenticated: !!loadTokens().access,
  permissions: initPermissions(),

  login: async (nip: string, password: string) => {
    const res = await api.post("/auth/login", { nip, password });
    const { access_token, refresh_token } = res.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    const user = decodeJWT(access_token);
    if (user?.role) localStorage.setItem("user_role", user.role);
    set({ user, accessToken: access_token, refreshToken: refresh_token, isAuthenticated: true });
    await get().fetchPermissions();
  },

  logout: async () => {
    const { refreshToken } = get();
    try {
      await api.post("/auth/logout", { refresh_token: refreshToken });
    } catch {
      // ignore
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, permissions: [] });
  },

  refresh: async () => {
    const { refreshToken } = get();
    if (!refreshToken) throw new Error("no refresh token");
    try {
      const res = await api.post("/auth/refresh", { refresh_token: refreshToken });
      const { access_token, refresh_token } = res.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      const user = decodeJWT(access_token);
      set({ user, accessToken: access_token, refreshToken: refresh_token });
      await get().fetchPermissions();
    } catch {
      get().logout();
      throw new Error("refresh failed");
    }
  },

  setTokens: (access: string, refresh: string) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    const user = decodeJWT(access);
    set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true });
  },

  fetchPermissions: async () => {
    try {
      const res = await api.get("/auth/permissions");
      const perms = Array.isArray(res.data) ? res.data.map((p: Permission) => p.name) : [];
      localStorage.setItem("user_permissions", JSON.stringify(perms));
      set({ permissions: perms });
    } catch {
      set({ permissions: [] });
    }
  },

  hasPermission: (perm: string) => {
    return get().permissions.includes(perm);
  },
}));
