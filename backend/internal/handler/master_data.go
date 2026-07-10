package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/service"
	"github.com/go-chi/chi/v5"
)

type MasterDataHandler struct {
	locationSvc service.LocationService
	sectionSvc  service.SectionService
	shiftSvc    service.ShiftService
	paramSvc    service.HSEParameterService
	userSvc     service.UserService
}

func NewMasterDataHandler(
	locationSvc service.LocationService,
	sectionSvc service.SectionService,
	shiftSvc service.ShiftService,
	paramSvc service.HSEParameterService,
	userSvc service.UserService,
) *MasterDataHandler {
	return &MasterDataHandler{
		locationSvc: locationSvc,
		sectionSvc:  sectionSvc,
		shiftSvc:    shiftSvc,
		paramSvc:    paramSvc,
		userSvc:     userSvc,
	}
}

func (h *MasterDataHandler) ListLocations(w http.ResponseWriter, r *http.Request) {
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit > 0 {
		if limit > 100 {
			limit = 100
		}
		data, total, err := h.locationSvc.List(r.Context(), offset, limit)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"data":   data,
			"total":  total,
			"offset": offset,
			"limit":  limit,
		})
		return
	}

	data, _, err := h.locationSvc.List(r.Context(), 0, 1000000)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, data)
}

func (h *MasterDataHandler) GetLocationByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	data, err := h.locationSvc.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "lokasi tidak ditemukan")
		return
	}
	respondJSON(w, http.StatusOK, data)
}

func (h *MasterDataHandler) CreateLocation(w http.ResponseWriter, r *http.Request) {
	var loc model.Location
	json.NewDecoder(r.Body).Decode(&loc)
	if err := h.locationSvc.Create(r.Context(), &loc); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, loc)
}

func (h *MasterDataHandler) UpdateLocation(w http.ResponseWriter, r *http.Request) {
	var loc model.Location
	json.NewDecoder(r.Body).Decode(&loc)
	if err := h.locationSvc.Update(r.Context(), &loc); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, loc)
}

func (h *MasterDataHandler) DeleteLocation(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.locationSvc.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "berhasil dihapus"})
}

// Sections
func (h *MasterDataHandler) ListSections(w http.ResponseWriter, r *http.Request) {
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit > 0 {
		if limit > 100 {
			limit = 100
		}
		data, total, err := h.sectionSvc.List(r.Context(), offset, limit)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"data":   data,
			"total":  total,
			"offset": offset,
			"limit":  limit,
		})
		return
	}

	data, _, err := h.sectionSvc.List(r.Context(), 0, 1000000)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, data)
}

func (h *MasterDataHandler) CreateSection(w http.ResponseWriter, r *http.Request) {
	var sec model.Section
	json.NewDecoder(r.Body).Decode(&sec)
	if err := h.sectionSvc.Create(r.Context(), &sec); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, sec)
}

func (h *MasterDataHandler) UpdateSection(w http.ResponseWriter, r *http.Request) {
	var sec model.Section
	json.NewDecoder(r.Body).Decode(&sec)
	if err := h.sectionSvc.Update(r.Context(), &sec); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, sec)
}

func (h *MasterDataHandler) DeleteSection(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.sectionSvc.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "berhasil dihapus"})
}

// Shifts
func (h *MasterDataHandler) ListShifts(w http.ResponseWriter, r *http.Request) {
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit > 0 {
		if limit > 100 {
			limit = 100
		}
		data, total, err := h.shiftSvc.List(r.Context(), offset, limit)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"data":   data,
			"total":  total,
			"offset": offset,
			"limit":  limit,
		})
		return
	}

	data, _, err := h.shiftSvc.List(r.Context(), 0, 1000000)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, data)
}

func (h *MasterDataHandler) CreateShift(w http.ResponseWriter, r *http.Request) {
	var shift model.Shift
	json.NewDecoder(r.Body).Decode(&shift)
	if err := h.shiftSvc.Create(r.Context(), &shift); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, shift)
}

func (h *MasterDataHandler) UpdateShift(w http.ResponseWriter, r *http.Request) {
	var shift model.Shift
	json.NewDecoder(r.Body).Decode(&shift)
	if err := h.shiftSvc.Update(r.Context(), &shift); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, shift)
}

func (h *MasterDataHandler) DeleteShift(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.shiftSvc.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "berhasil dihapus"})
}

// HSE Parameters
func (h *MasterDataHandler) ListParameters(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	if category != "" {
		data, err := h.paramSvc.GetByAssetCategory(r.Context(), model.AssetCategory(category))
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		respondJSON(w, http.StatusOK, data)
		return
	}

	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit > 0 {
		if limit > 100 {
			limit = 100
		}
		data, total, err := h.paramSvc.List(r.Context(), offset, limit)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"data":   data,
			"total":  total,
			"offset": offset,
			"limit":  limit,
		})
		return
	}

	data, _, err := h.paramSvc.List(r.Context(), 0, 1000000)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, data)
}

func (h *MasterDataHandler) CreateParameter(w http.ResponseWriter, r *http.Request) {
	var param model.HSEParameter
	json.NewDecoder(r.Body).Decode(&param)
	if err := h.paramSvc.Create(r.Context(), &param); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, param)
}

func (h *MasterDataHandler) UpdateParameter(w http.ResponseWriter, r *http.Request) {
	var param model.HSEParameter
	json.NewDecoder(r.Body).Decode(&param)
	if err := h.paramSvc.Update(r.Context(), &param); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, param)
}

func (h *MasterDataHandler) DeleteParameter(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.paramSvc.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "berhasil dihapus"})
}

// Users
func (h *MasterDataHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 10
	}
	users, total, err := h.userSvc.List(r.Context(), offset, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data":   users,
		"total":  total,
		"offset": offset,
		"limit":  limit,
	})
}

func (h *MasterDataHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var user model.User
	json.NewDecoder(r.Body).Decode(&user)
	if err := h.userSvc.Create(r.Context(), &user); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, user)
}

func (h *MasterDataHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	var user model.User
	json.NewDecoder(r.Body).Decode(&user)
	if err := h.userSvc.Update(r.Context(), &user); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, user)
}

func (h *MasterDataHandler) GenerateLocationQR(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	baseURL := ""
	if ref := r.Referer(); ref != "" {
		if u, err := url.Parse(ref); err == nil && u.Host != "" {
			baseURL = fmt.Sprintf("%s://%s", u.Scheme, u.Host)
		}
	}
	if baseURL == "" {
		scheme := "http"
		if proto := r.Header.Get("X-Forwarded-Proto"); proto != "" {
			scheme = proto
		}
		baseURL = fmt.Sprintf("%s://%s", scheme, r.Host)
	}
	png, err := h.locationSvc.GenerateQRCode(r.Context(), id, baseURL)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.Header().Set("Content-Type", "image/png")
	w.Write(png)
}
