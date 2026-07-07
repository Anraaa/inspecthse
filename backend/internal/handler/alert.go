package handler

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/anomalyco/inspecthse/internal/middleware"
	"github.com/anomalyco/inspecthse/internal/service"
	"github.com/go-chi/chi/v5"
)

type AlertHandler struct {
	svc service.AlertService
}

func NewAlertHandler(svc service.AlertService) *AlertHandler {
	return &AlertHandler{svc: svc}
}

func (h *AlertHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int64)

	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	var isRead *bool
	if v := r.URL.Query().Get("is_read"); v != "" {
		b := v == "true"
		isRead = &b
	}

	alerts, total, err := h.svc.ListByUserIDWithFilter(r.Context(), userID, isRead, offset, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data":   alerts,
		"total":  total,
		"offset": offset,
		"limit":  limit,
	})
}

func (h *AlertHandler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err := h.svc.MarkAsRead(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, "gagal menandai notifikasi")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "notifikasi telah dibaca"})
}

func (h *AlertHandler) MarkAllAsRead(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int64)

	if err := h.svc.MarkAllAsRead(r.Context(), userID); err != nil {
		respondError(w, http.StatusInternalServerError, "gagal menandai semua notifikasi")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "semua notifikasi telah dibaca"})
}

func (h *AlertHandler) UnreadCount(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int64)

	count, err := h.svc.UnreadCount(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(fmt.Sprintf(`{"count":%d}`, count)))
}
