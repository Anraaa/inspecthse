package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/service"
	"github.com/go-chi/chi/v5"
)

type RoleHandler struct {
	svc service.RoleService
}

func NewRoleHandler(svc service.RoleService) *RoleHandler {
	return &RoleHandler{svc: svc}
}

func (h *RoleHandler) List(w http.ResponseWriter, r *http.Request) {
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit > 0 {
		if limit > 100 {
			limit = 100
		}
		roles, total, err := h.svc.List(r.Context(), offset, limit)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"data":   roles,
			"total":  total,
			"offset": offset,
			"limit":  limit,
		})
		return
	}

	roles, _, err := h.svc.List(r.Context(), 0, 1000000)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, roles)
}

func (h *RoleHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	role, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, role)
}

func (h *RoleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var role model.RoleInfo
	if err := json.NewDecoder(r.Body).Decode(&role); err != nil {
		respondError(w, http.StatusBadRequest, "format request tidak valid")
		return
	}
	if err := h.svc.Create(r.Context(), &role); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, role)
}

func (h *RoleHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var role model.RoleInfo
	if err := json.NewDecoder(r.Body).Decode(&role); err != nil {
		respondError(w, http.StatusBadRequest, "format request tidak valid")
		return
	}
	role.ID = id
	if err := h.svc.Update(r.Context(), &role); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, role)
}

func (h *RoleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.svc.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "role berhasil dihapus"})
}

func (h *RoleHandler) GetPermissions(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	perms, err := h.svc.GetPermissions(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, perms)
}

func (h *RoleHandler) SetPermissions(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var req struct {
		PermissionIDs []int64 `json:"permission_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "format request tidak valid")
		return
	}
	if err := h.svc.SetPermissions(r.Context(), id, req.PermissionIDs); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "permissions berhasil diperbarui"})
}
