import { create } from "zustand";
import api from "@/lib/axios";
import type { Role } from "@/types";

interface User {
  user_id: number;
  email: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
}

function decodeJWT(token: string): User | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return {
      user_id: decoded.user_id,
      email: decoded.email,
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    const { access } = loadTokens();
    return access ? decodeJWT(access) : null;
  })(),
  accessToken: loadTokens().access,
  refreshToken: loadTokens().refresh,
  isAuthenticated: !!loadTokens().access,

  login: async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { access_token, refresh_token } = res.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    const user = decodeJWT(access_token);
    if (user?.role) localStorage.setItem("user_role", user.role);
    set({ user, accessToken: access_token, refreshToken: refresh_token, isAuthenticated: true });
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
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
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
}));
