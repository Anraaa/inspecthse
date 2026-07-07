package handler

import (
	"bytes"
	"io"
	"net/http"
	"strconv"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/service"
)

type ExportHandler struct {
	svc service.ExportService
}

func NewExportHandler(svc service.ExportService) *ExportHandler {
	return &ExportHandler{svc: svc}
}

func (h *ExportHandler) ExportChecksheet(w http.ResponseWriter, r *http.Request) {
	year, _ := strconv.Atoi(r.URL.Query().Get("year"))
	category := r.URL.Query().Get("category")
	locationID, _ := strconv.ParseInt(r.URL.Query().Get("location_id"), 10, 64)
	sectionID, _ := strconv.ParseInt(r.URL.Query().Get("section_id"), 10, 64)

	data, err := h.svc.ExportChecksheet(r.Context(), year, model.AssetCategory(category), locationID, sectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", "attachment; filename=checksheet.xlsx")
	w.Write(data)
}

func (h *ExportHandler) DownloadImportTemplate(w http.ResponseWriter, r *http.Request) {
	data, err := h.svc.DownloadImportTemplate(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", "attachment; filename=template_import_aset.xlsx")
	w.Write(data)
}

func (h *ExportHandler) ImportAssets(w http.ResponseWriter, r *http.Request) {
	// Parse input file up to 10MB
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		respondError(w, http.StatusBadRequest, "gagal memproses multipart form")
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "file tidak ditemukan")
		return
	}
	defer file.Close()

	var buf bytes.Buffer
	if _, err := io.Copy(&buf, file); err != nil {
		respondError(w, http.StatusInternalServerError, "gagal membaca file")
		return
	}

	res, err := h.svc.ImportAssets(r.Context(), buf.Bytes())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, res)
}
