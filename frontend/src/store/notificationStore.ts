import { create } from "zustand";
import { fetchAlerts, fetchUnreadCount, markAlertAsRead, markAllAlertsAsRead } from "@/lib/api";
import type { Alert } from "@/types";

interface NotificationState {
  alerts: Alert[];
  total: number;
  unreadCount: number;
  loading: boolean;
  loadAlerts: (params?: { is_read?: boolean; offset?: number; limit?: number }) => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  alerts: [],
  total: 0,
  unreadCount: 0,
  loading: false,

  loadAlerts: async (params) => {
    set({ loading: true });
    try {
      const res = await fetchAlerts(params);
      set({ alerts: res?.data ?? [], total: res?.total ?? 0 });
    } finally {
      set({ loading: false });
    }
  },

  loadUnreadCount: async () => {
    try {
      const count = await fetchUnreadCount();
      set({ unreadCount: count });
    } catch {
      // ignore
    }
  },

  markAsRead: async (id) => {
    await markAlertAsRead(id);
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, is_read: true } : a)),
    }));
  },

  markAllAsRead: async () => {
    await markAllAlertsAsRead();
    set({ unreadCount: 0 });
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, is_read: true })),
    }));
  },
}));
