package handler

import (
	"encoding/json"
	"net/http"

	"github.com/anomalyco/inspecthse/internal/middleware"
	"github.com/anomalyco/inspecthse/internal/service"
)

type AuthHandler struct {
	svc     service.AuthService
	roleSvc service.RoleService
}

func NewAuthHandler(svc service.AuthService, roleSvc service.RoleService) *AuthHandler {
	return &AuthHandler{svc: svc, roleSvc: roleSvc}
}

type loginRequest struct {
	NIP      string `json:"nip" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "format request tidak valid")
		return
	}

	accessToken, refreshToken, err := h.svc.Login(r.Context(), req.NIP, req.Password)
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req refreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "format request tidak valid")
		return
	}

	accessToken, refreshToken, err := h.svc.RefreshToken(r.Context(), req.RefreshToken)
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

type logoutRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(int64)

	var req logoutRequest
	json.NewDecoder(r.Body).Decode(&req)

	if err := h.svc.Logout(r.Context(), userID, req.RefreshToken); err != nil {
		respondError(w, http.StatusInternalServerError, "gagal logout")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "berhasil logout"})
}

func (h *AuthHandler) UserPermissions(w http.ResponseWriter, r *http.Request) {
	role, _ := r.Context().Value(middleware.UserRoleKey).(string)

	roleData, err := h.roleSvc.GetPermissionsByRoleName(r.Context(), role)
	if err != nil {
		respondJSON(w, http.StatusOK, []string{})
		return
	}

	respondJSON(w, http.StatusOK, roleData)
}
