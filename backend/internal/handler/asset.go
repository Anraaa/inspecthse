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

type AssetHandler struct {
	svc         service.AssetService
	locationSvc service.LocationService
}

func NewAssetHandler(svc service.AssetService, locationSvc service.LocationService) *AssetHandler {
	return &AssetHandler{svc: svc, locationSvc: locationSvc}
}

func (h *AssetHandler) List(w http.ResponseWriter, r *http.Request) {
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 10
	}

	filter := map[string]interface{}{}
	if category := r.URL.Query().Get("category"); category != "" {
		filter["asset_category"] = category
	}
	if locID := r.URL.Query().Get("location_id"); locID != "" {
		if id, err := strconv.ParseInt(locID, 10, 64); err == nil {
			filter["location_id"] = id
		}
	}
	if secID := r.URL.Query().Get("section_id"); secID != "" {
		if id, err := strconv.ParseInt(secID, 10, 64); err == nil {
			filter["section_id"] = id
		}
	}
	if search := r.URL.Query().Get("search"); search != "" {
		filter["search"] = search
	}

	assets, total, err := h.svc.List(r.Context(), filter, offset, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data":   assets,
		"total":  total,
		"offset": offset,
		"limit":  limit,
	})
}

func (h *AssetHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	asset, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "asset tidak ditemukan")
		return
	}
	respondJSON(w, http.StatusOK, asset)
}

func (h *AssetHandler) GetByQRCode(w http.ResponseWriter, r *http.Request) {
	qrCode := chi.URLParam(r, "qrCode")
	asset, err := h.svc.GetByQRCode(r.Context(), qrCode)
	if err != nil {
		respondError(w, http.StatusNotFound, "asset tidak ditemukan")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"type": "asset",
		"data": asset,
	})
}

func (h *AssetHandler) Create(w http.ResponseWriter, r *http.Request) {
	var asset model.Asset
	if err := json.NewDecoder(r.Body).Decode(&asset); err != nil {
		respondError(w, http.StatusBadRequest, "format request tidak valid")
		return
	}
	if err := h.svc.Create(r.Context(), &asset); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, asset)
}

func (h *AssetHandler) Update(w http.ResponseWriter, r *http.Request) {
	var asset model.Asset
	if err := json.NewDecoder(r.Body).Decode(&asset); err != nil {
		respondError(w, http.StatusBadRequest, "format request tidak valid")
		return
	}
	if err := h.svc.Update(r.Context(), &asset); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, asset)
}

func (h *AssetHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.svc.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "asset berhasil dihapus"})
}

func (h *AssetHandler) GenerateQR(w http.ResponseWriter, r *http.Request) {
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
	png, err := h.svc.GenerateQRCode(r.Context(), id, baseURL)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.Header().Set("Content-Type", "image/png")
	w.Write(png)
}
