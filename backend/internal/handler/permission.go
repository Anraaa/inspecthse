package handler

import (
	"net/http"

	"github.com/anomalyco/inspecthse/internal/service"
)

type PermissionHandler struct {
	svc service.PermissionService
}

func NewPermissionHandler(svc service.PermissionService) *PermissionHandler {
	return &PermissionHandler{svc: svc}
}

func (h *PermissionHandler) List(w http.ResponseWriter, r *http.Request) {
	perms, err := h.svc.List(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, perms)
}

func (h *PermissionHandler) ListByModule(w http.ResponseWriter, r *http.Request) {
	perms, err := h.svc.ListByModule(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, perms)
}
