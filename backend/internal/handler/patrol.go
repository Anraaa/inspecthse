package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/anomalyco/inspecthse/internal/middleware"
	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/service"
	"github.com/go-chi/chi/v5"
)

type PatrolHandler struct {
	svc service.PatrolService
}

func NewPatrolHandler(svc service.PatrolService) *PatrolHandler {
	return &PatrolHandler{svc: svc}
}

type submitPatrolRequest struct {
	AssetID     int64                    `json:"asset_id"`
	ShiftID     int64                    `json:"shift_id"`
	ClientUUID  string                   `json:"client_uuid"`
	Details     []model.PatrolDetail     `json:"details"`
	Attachments []model.PatrolAttachment `json:"attachments"`
}

type approveRejectRequest struct {
	Reason string `json:"reason"`
}

func (h *PatrolHandler) Submit(w http.ResponseWriter, r *http.Request) {
	var req submitPatrolRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "format request tidak valid")
		return
	}

	userID := r.Context().Value(middleware.UserIDKey).(int64)

	patrol := &model.Patrol{
		UserID:     userID,
		AssetID:    req.AssetID,
		ShiftID:    req.ShiftID,
		ClientUUID: req.ClientUUID,
	}

	if err := h.svc.Create(r.Context(), patrol, req.Details, req.Attachments); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.svc.Submit(r.Context(), patrol.ID); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, patrol)
}

func (h *PatrolHandler) Approve(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	userID := r.Context().Value(middleware.UserIDKey).(int64)

	if err := h.svc.Approve(r.Context(), id, userID); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "patrol berhasil disetujui"})
}

func (h *PatrolHandler) Reject(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	userID := r.Context().Value(middleware.UserIDKey).(int64)

	var req approveRejectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "format request tidak valid")
		return
	}

	if req.Reason == "" {
		respondError(w, http.StatusBadRequest, "alasan penolakan harus diisi")
		return
	}

	if err := h.svc.Reject(r.Context(), id, userID, req.Reason); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "patrol ditolak"})
}

func (h *PatrolHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	patrol, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "patrol tidak ditemukan")
		return
	}
	respondJSON(w, http.StatusOK, patrol)
}

type ghostEditRequest struct {
	Details []model.PatrolDetail `json:"details"`
}

func (h *PatrolHandler) GhostEdit(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	userID := r.Context().Value(middleware.UserIDKey).(int64)

	var req ghostEditRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "format request tidak valid")
		return
	}

	if err := h.svc.GhostEdit(r.Context(), id, req.Details, userID); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "ghost edit berhasil"})
}

func (h *PatrolHandler) List(w http.ResponseWriter, r *http.Request) {
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 10
	}

	filter := map[string]interface{}{}
	if status := r.URL.Query().Get("status"); status != "" {
		filter["status"] = status
	}
	if userID := r.URL.Query().Get("user_id"); userID != "" {
		if id, err := strconv.ParseInt(userID, 10, 64); err == nil {
			filter["user_id"] = id
		}
	}
	if search := r.URL.Query().Get("search"); search != "" {
		filter["search"] = search
	}
	if assetID := r.URL.Query().Get("asset_id"); assetID != "" {
		if id, err := strconv.ParseInt(assetID, 10, 64); err == nil {
			filter["asset_id"] = id
		}
	}
	if locationID := r.URL.Query().Get("location_id"); locationID != "" {
		if id, err := strconv.ParseInt(locationID, 10, 64); err == nil {
			filter["location_id"] = id
		}
	}

	patrols, total, err := h.svc.List(r.Context(), filter, offset, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data":   patrols,
		"total":  total,
		"offset": offset,
		"limit":  limit,
	})
}
