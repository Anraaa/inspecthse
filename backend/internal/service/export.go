package service

import (
	"bytes"
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
	"github.com/xuri/excelize/v2"
)

type exportService struct {
	assetRepo   repository.AssetRepository
	patrolRepo  repository.PatrolRepository
	detailRepo  repository.PatrolDetailRepository
	locationRepo repository.LocationRepository
	sectionRepo repository.SectionRepository
}

func NewExportService(
	assetRepo repository.AssetRepository,
	patrolRepo repository.PatrolRepository,
	detailRepo repository.PatrolDetailRepository,
	locationRepo repository.LocationRepository,
	sectionRepo repository.SectionRepository,
) ExportService {
	return &exportService{
		assetRepo:    assetRepo,
		patrolRepo:   patrolRepo,
		detailRepo:   detailRepo,
		locationRepo: locationRepo,
		sectionRepo:  sectionRepo,
	}
}

func (s *exportService) ExportChecksheet(ctx context.Context, year int, category model.AssetCategory, locationID, sectionID int64) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	sheetName := fmt.Sprintf("Checksheet %d", year)
	f.SetSheetName("Sheet1", sheetName)

	// Build filter for assets
	filter := map[string]interface{}{
		"asset_category": category,
	}
	if locationID > 0 {
		filter["location_id"] = locationID
	}
	if sectionID > 0 {
		filter["section_id"] = sectionID
	}

	assets, _, err := s.assetRepo.List(ctx, filter, 0, 10000)
	if err != nil {
		return nil, err
	}

	// Get location and section names for header
	var locationName, sectionName string
	if locationID > 0 {
		loc, _ := s.locationRepo.FindByID(ctx, locationID)
		if loc != nil {
			locationName = loc.Name
		}
	}
	if sectionID > 0 {
		sec, _ := s.sectionRepo.FindByID(ctx, sectionID)
		if sec != nil {
			sectionName = sec.Name
		}
	}

	// Header rows
	categoryLabel := string(category)
	if category == model.AssetCategoryHydrant {
		categoryLabel = "HYDRANT"
	}
	title := fmt.Sprintf("Checksheet Inspeksi %s %d", categoryLabel, year)
	if locationName != "" {
		title += " - " + locationName
	}
	if sectionName != "" {
		title += " - " + sectionName
	}

	f.SetCellValue(sheetName, "A1", "PT. INSPECT HSE")
	f.SetCellValue(sheetName, "A2", title)

	if category == model.AssetCategoryAPAR {
		f.MergeCell(sheetName, "A1", "L1")
		f.MergeCell(sheetName, "A2", "L2")
		f.SetCellValue(sheetName, "M1", "Form No: HSE-F-15")
		f.SetCellValue(sheetName, "M2", "Rev: 00 | Tgl Terbit: 01/01/2026")
		f.MergeCell(sheetName, "M1", "O1")
		f.MergeCell(sheetName, "M2", "O2")
	} else if category == model.AssetCategoryFireAlarm {
		f.MergeCell(sheetName, "A1", "L1")
		f.MergeCell(sheetName, "A2", "L2")
		f.SetCellValue(sheetName, "M1", "Form No: HSE-F-83")
		f.SetCellValue(sheetName, "M2", "Rev: 00 | Tgl Terbit: 01/01/2026")
		f.MergeCell(sheetName, "M1", "O1")
		f.MergeCell(sheetName, "M2", "O2")
	} else {
		f.MergeCell(sheetName, "A1", "O1")
		f.MergeCell(sheetName, "A2", "O2")
	}

	// Table headers
	var headers []string
	if category == model.AssetCategoryFireAlarm {
		headers = []string{"No", "Nama Aset", "Serial Number", "Lokasi", "Tipe Alarm", "Lokasi Panel"}
	} else if category == model.AssetCategoryAPAR {
		headers = []string{"No", "Nama Aset", "Serial Number", "Lokasi", "Berat"}
	} else {
		headers = []string{"No", "Nama Aset", "Serial Number", "Lokasi"}
	}
	months := []string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}
	headers = append(headers, months...)

	colLetters := []string{
		"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
	}
	for i, h := range headers {
		cell := colLetters[i] + "3"
		f.SetCellValue(sheetName, cell, h)
	}

	// Styles
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 11},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: true},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#E5E7EB"}, Pattern: 1},
	})

	dataStyle, _ := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: true},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
	})

	approvedStyle, _ := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Font: &excelize.Font{Color: "16A34A", Bold: true, Size: 14},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
	})

	rejectedStyle, _ := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Font: &excelize.Font{Color: "DC2626", Bold: true, Size: 14},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
	})

	waitingStyle, _ := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Font: &excelize.Font{Color: "CA8A04", Bold: true, Size: 14},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
	})

	emptyStyle, _ := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Font: &excelize.Font{Color: "9CA3AF", Size: 14},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
	})

	// Apply header style
	for i := range headers {
		cell := colLetters[i] + "3"
		f.SetCellStyle(sheetName, cell, cell, headerStyle)
	}

	// Get patrol data for each asset per month
	// We'll query all patrols for these assets in the year
	assetIDs := make([]int64, len(assets))
	for i, a := range assets {
		assetIDs[i] = a.ID
	}

	// Query patrols for the year for these assets
	patrolsByAssetMonth := make(map[int64]map[int]string) // assetID -> month -> status symbol
	anomalies := []AnomalyRecord{}

	for _, assetID := range assetIDs {
		patrolsByAssetMonth[assetID] = make(map[int]string)
	}

	// Get all patrols for these assets in the year
	startOfYear := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
	endOfYear := time.Date(year, 12, 31, 23, 59, 59, 0, time.UTC)

	// Query patrols with date range
	patrols, _, err := s.patrolRepo.List(ctx, map[string]interface{}{
		"asset_ids":  assetIDs,
		"date_from":  startOfYear.Format("2006-01-02"),
		"date_to":    endOfYear.Format("2006-01-02"),
	}, 0, 10000)
	if err == nil {
		for _, p := range patrols {
			if p.SubmittedAt == nil {
				continue
			}
			month := int(p.SubmittedAt.Month())
			var symbol string
			switch p.Status {
			case model.PatrolStatusApproved:
				symbol = "✓"
			case model.PatrolStatusRejected:
				symbol = "✗"
			case model.PatrolStatusWaitingApproval, model.PatrolStatusSubmitted:
				symbol = "~"
			default:
				symbol = "-"
			}
			patrolsByAssetMonth[p.AssetID][month] = symbol
		}
	}

	// Get anomalies for sheet 2
	for _, assetID := range assetIDs {
		details, err := s.detailRepo.ListByPatrolID(ctx, assetID)
		if err != nil {
			continue
		}
		for _, d := range details {
			if d.IsAnomaly {
				// Need to get patrol info for this detail
				patrol, err := s.patrolRepo.FindByID(ctx, d.PatrolID)
				if err != nil {
					continue
				}
				if patrol.SubmittedAt != nil && patrol.SubmittedAt.Year() == year {
					paramName := fmt.Sprintf("Param #%d", d.HSEParameterID)
					anomalies = append(anomalies, AnomalyRecord{
						Date:     patrol.SubmittedAt.Format("2006-01-02"),
						Asset:    getAssetName(assets, patrol.AssetID),
						Parameter: paramName,
						Value:    d.Value,
						Notes:    d.Notes,
					})
				}
			}
		}
	}

	// Write asset data rows
	for i, asset := range assets {
		row := i + 4
		f.SetCellValue(sheetName, "A"+strconv.Itoa(row), i+1)
		f.SetCellValue(sheetName, "B"+strconv.Itoa(row), asset.Name)
		f.SetCellValue(sheetName, "C"+strconv.Itoa(row), asset.SerialNumber)
		f.SetCellValue(sheetName, "D"+strconv.Itoa(row), locationName)

		var startMonthCol int
		if category == model.AssetCategoryFireAlarm {
			tipeAlarm := ""
			if asset.Size != nil {
				tipeAlarm = *asset.Size
			}
			lokasiPanel := ""
			if asset.Plant != nil {
				lokasiPanel = *asset.Plant
			}
			f.SetCellValue(sheetName, "E"+strconv.Itoa(row), tipeAlarm)
			f.SetCellValue(sheetName, "F"+strconv.Itoa(row), lokasiPanel)
			startMonthCol = 6
		} else if category == model.AssetCategoryAPAR {
			berat := ""
			if asset.Size != nil {
				berat = *asset.Size
			}
			f.SetCellValue(sheetName, "E"+strconv.Itoa(row), berat)
			startMonthCol = 5
		} else {
			startMonthCol = 4
		}

		// Month columns
		for m := 1; m <= 12; m++ {
			col := colLetters[startMonthCol-1+m]
			cell := col + strconv.Itoa(row)
			symbol := patrolsByAssetMonth[asset.ID][m]
			if symbol == "" {
				symbol = "-"
			}
			f.SetCellValue(sheetName, cell, symbol)

			// Apply conditional style
			switch symbol {
			case "✓":
				f.SetCellStyle(sheetName, cell, cell, approvedStyle)
			case "✗":
				f.SetCellStyle(sheetName, cell, cell, rejectedStyle)
			case "~":
				f.SetCellStyle(sheetName, cell, cell, waitingStyle)
			default:
				f.SetCellStyle(sheetName, cell, cell, emptyStyle)
			}
		}

		// Apply data style to metadata columns
		for c := 0; c < startMonthCol; c++ {
			cell := colLetters[c] + strconv.Itoa(row)
			f.SetCellStyle(sheetName, cell, cell, dataStyle)
		}
	}

	// Footer
	lastRow := len(assets) + 4
	footerRow := lastRow + 1
	f.SetCellValue(sheetName, "A"+strconv.Itoa(footerRow), "Keterangan:")
	footerRow++
	f.SetCellValue(sheetName, "A"+strconv.Itoa(footerRow), "✓ = Disetujui (Approved)")
	footerRow++
	f.SetCellValue(sheetName, "A"+strconv.Itoa(footerRow), "✗ = Ditolak (Rejected)")
	footerRow++
	f.SetCellValue(sheetName, "A"+strconv.Itoa(footerRow), "~ = Menunggu Persetujuan (Waiting Approval)")
	footerRow++
	f.SetCellValue(sheetName, "A"+strconv.Itoa(footerRow), "- = Belum Inspeksi")
	footerRow += 2
	f.SetCellValue(sheetName, "A"+strconv.Itoa(footerRow), "Dibuat pada: "+time.Now().Format("2006-01-02 15:04"))
	footerRow += 2
	f.SetCellValue(sheetName, "B"+strconv.Itoa(footerRow), "Petugas,")
	f.SetCellValue(sheetName, "E"+strconv.Itoa(footerRow), "Supervisor,")
	footerRow += 3
	f.SetCellValue(sheetName, "B"+strconv.Itoa(footerRow), "( .................................. )")
	f.SetCellValue(sheetName, "E"+strconv.Itoa(footerRow), "( .................................. )")

	// Sheet 2: Detail Temuan
	sheet2 := "Detail Temuan"
	f.NewSheet(sheet2)
	anomalyHeaders := []string{"No", "Tanggal", "Aset", "Parameter", "Nilai", "Catatan", "Foto"}
	for i, h := range anomalyHeaders {
		cell := colLetters[i] + "1"
		f.SetCellValue(sheet2, cell, h)
		f.SetCellStyle(sheet2, cell, cell, headerStyle)
	}

	for i, a := range anomalies {
		row := i + 2
		f.SetCellValue(sheet2, "A"+strconv.Itoa(row), i+1)
		f.SetCellValue(sheet2, "B"+strconv.Itoa(row), a.Date)
		f.SetCellValue(sheet2, "C"+strconv.Itoa(row), a.Asset)
		f.SetCellValue(sheet2, "D"+strconv.Itoa(row), a.Parameter)
		f.SetCellValue(sheet2, "E"+strconv.Itoa(row), a.Value)
		f.SetCellValue(sheet2, "F"+strconv.Itoa(row), a.Notes)
		f.SetCellValue(sheet2, "G"+strconv.Itoa(row), "") // Foto link placeholder
		for c := 0; c < len(anomalyHeaders); c++ {
			cell := colLetters[c] + strconv.Itoa(row)
			f.SetCellStyle(sheet2, cell, cell, dataStyle)
		}
	}

	// Auto-fit columns
	for i := range colLetters[:len(headers)] {
		f.SetColWidth(sheetName, colLetters[i], colLetters[i], 15)
	}
	f.SetColWidth(sheetName, "B", "B", 30)
	f.SetColWidth(sheetName, "C", "C", 20)
	f.SetColWidth(sheetName, "D", "D", 20)
	if category == model.AssetCategoryFireAlarm {
		f.SetColWidth(sheetName, "E", "E", 20)
		f.SetColWidth(sheetName, "F", "F", 25)
	} else if category == model.AssetCategoryAPAR {
		f.SetColWidth(sheetName, "E", "E", 15)
	}

	for i := range colLetters[:len(anomalyHeaders)] {
		f.SetColWidth(sheet2, colLetters[i], colLetters[i], 20)
	}

	for i := range colLetters[:len(anomalyHeaders)] {
		f.SetColWidth(sheet2, colLetters[i], colLetters[i], 20)
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

type AnomalyRecord struct {
	Date      string
	Asset     string
	Parameter string
	Value     string
	Notes     string
}

func getAssetName(assets []model.Asset, id int64) string {
	for _, a := range assets {
		if a.ID == id {
			return a.Name
		}
	}
	return fmt.Sprintf("Asset #%d", id)
}

func (s *exportService) ImportAssets(ctx context.Context, file []byte) (*ImportResult, error) {
	f, err := excelize.OpenReader(bytes.NewReader(file))
	if err != nil {
		return nil, err
	}
	defer f.Close()

	sheet := f.GetSheetName(0)
	rows, err := f.GetRows(sheet)
	if err != nil {
		return nil, err
	}

	if len(rows) < 2 {
		return nil, fmt.Errorf("file kosong atau hanya header")
	}

	headers := rows[0]
	
	// Map column index to field
	colMap := make(map[string]int)
	for i, h := range headers {
		colMap[strings.ToLower(strings.TrimSpace(h))] = i
	}

	// Validate required columns
	required := []string{"name", "category", "serial_number", "location_id"}
	for _, req := range required {
		if _, ok := colMap[req]; !ok {
			return nil, fmt.Errorf("kolom wajib '%s' tidak ditemukan", req)
		}
	}

	result := &ImportResult{
		Errors: []ImportError{},
	}

	// Process each row
	for rowIdx, row := range rows[1:] {
		lineNum := rowIdx + 2
		if len(row) < len(headers) {
			// Pad row
			row = append(row, make([]string, len(headers)-len(row))...)
		}

		getCol := func(key string) string {
			if idx, ok := colMap[key]; ok && idx < len(row) {
				return strings.TrimSpace(row[idx])
			}
			return ""
		}

		name := getCol("name")
		category := getCol("category")
		serialNumber := getCol("serial_number")
		locationIDStr := getCol("location_id")
		picIDStr := getCol("pic_id")
		sectionIDStr := getCol("section_id")
		plant := getCol("plant")
		size := getCol("size")
		expiredAtStr := getCol("expired_at")

		// Validate required fields
		if name == "" || category == "" || serialNumber == "" || locationIDStr == "" {
			result.Errors = append(result.Errors, ImportError{
				Row:    lineNum,
				Field:  "required",
				Value:  "",
				Error:  "kolom wajib (name, category, serial_number, location_id) tidak boleh kosong",
			})
			continue
		}

		// Validate category
		var cat model.AssetCategory
		switch strings.ToUpper(category) {
		case "APAR":
			cat = model.AssetCategoryAPAR
		case "HYDRANT":
			cat = model.AssetCategoryHydrant
		case "FIRE_ALARM":
			cat = model.AssetCategoryFireAlarm
		default:
			result.Errors = append(result.Errors, ImportError{
				Row:    lineNum,
				Field:  "category",
				Value:  category,
				Error:  "kategori tidak valid (APAR, HYDRANT, FIRE_ALARM)",
			})
			continue
		}

		locationID, err := strconv.ParseInt(locationIDStr, 10, 64)
		if err != nil {
			result.Errors = append(result.Errors, ImportError{
				Row:    lineNum,
				Field:  "location_id",
				Value:  locationIDStr,
				Error:  "location_id harus angka",
			})
			continue
		}

		// Validate location exists
		loc, err := s.locationRepo.FindByID(ctx, locationID)
		if err != nil || loc == nil {
			result.Errors = append(result.Errors, ImportError{
				Row:    lineNum,
				Field:  "location_id",
				Value:  locationIDStr,
				Error:  "lokasi tidak ditemukan",
			})
			continue
		}

		var picID *int64
		if picIDStr != "" {
			id, err := strconv.ParseInt(picIDStr, 10, 64)
			if err != nil {
				result.Errors = append(result.Errors, ImportError{
					Row:    lineNum,
					Field:  "pic_id",
					Value:  picIDStr,
					Error:  "pic_id harus angka",
				})
				continue
			}
			picID = &id
		}

		var sectionID *int64
		if sectionIDStr != "" {
			id, err := strconv.ParseInt(sectionIDStr, 10, 64)
			if err != nil {
				result.Errors = append(result.Errors, ImportError{
					Row:    lineNum,
					Field:  "section_id",
					Value:  sectionIDStr,
					Error:  "section_id harus angka",
				})
				continue
			}
			sectionID = &id
		}

		var expiredAt *time.Time
		if expiredAtStr != "" {
			// Try multiple formats
			formats := []string{"2006-01-02", "02/01/2006", "2006/01/02"}
			var parsed time.Time
			parsedOk := false
			for _, format := range formats {
				if t, err := time.Parse(format, expiredAtStr); err == nil {
					parsed = t
					parsedOk = true
					break
				}
			}
			if !parsedOk {
				result.Errors = append(result.Errors, ImportError{
					Row:    lineNum,
					Field:  "expired_at",
					Value:  expiredAtStr,
					Error:  "format tanggal tidak valid (gunakan YYYY-MM-DD)",
				})
				continue
			}
			expiredAt = &parsed
		}

		// Create asset
		asset := &model.Asset{
			Name:         name,
			Category:     cat,
			SerialNumber: &serialNumber,
			LocationID:   locationID,
			PICID:        picID,
			SectionID:    sectionID,
			Plant:        &plant,
			Size:         &size,
			ExpiredAt:    expiredAt,
			IsActive:     true,
		}

		// Generate QR code
		asset.QRCode = fmt.Sprintf("INS-%s-%d-%d", cat, locationID, time.Now().Unix())

		if err := s.assetRepo.Create(ctx, asset); err != nil {
			result.Errors = append(result.Errors, ImportError{
				Row:    lineNum,
				Field:  "all",
				Value:  name,
				Error:  err.Error(),
			})
			continue
		}

		result.Success++
	}

	return result, nil
}