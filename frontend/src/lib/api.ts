import api from "./axios";
import type { Alert } from "@/types";

export async function fetchAlerts(params?: { is_read?: boolean; offset?: number; limit?: number }) {
  const res = await api.get("/alerts", { params });
  return res.data as { data: Alert[]; total: number; offset: number; limit: number };
}

export async function fetchUnreadCount() {
  const res = await api.get("/alerts/unread-count");
  return res.data.count as number;
}

export async function markAlertAsRead(id: number) {
  await api.put(`/alerts/${id}/read`);
}

export async function markAllAlertsAsRead() {
  await api.put("/alerts/read-all");
}
