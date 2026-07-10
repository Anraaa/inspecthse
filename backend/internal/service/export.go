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
	assetRepo    repository.AssetRepository
	patrolRepo   repository.PatrolRepository
	detailRepo   repository.PatrolDetailRepository
	locationRepo repository.LocationRepository
	sectionRepo  repository.SectionRepository
	userRepo     repository.UserRepository
	hseParamRepo repository.HSEParameterRepository
}

func NewExportService(
	assetRepo repository.AssetRepository,
	patrolRepo repository.PatrolRepository,
	detailRepo repository.PatrolDetailRepository,
	locationRepo repository.LocationRepository,
	sectionRepo repository.SectionRepository,
	userRepo repository.UserRepository,
	hseParamRepo repository.HSEParameterRepository,
) ExportService {
	return &exportService{
		assetRepo:    assetRepo,
		patrolRepo:   patrolRepo,
		detailRepo:   detailRepo,
		locationRepo: locationRepo,
		sectionRepo:  sectionRepo,
		userRepo:     userRepo,
		hseParamRepo: hseParamRepo,
	}
}

func (s *exportService) ExportChecksheet(ctx context.Context, year int, category model.AssetCategory, locationID, sectionID, assetID int64) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	sheetName := fmt.Sprintf("Checksheet %d", year)
	f.SetSheetName("Sheet1", sheetName)

	filter := map[string]interface{}{
		"asset_category": category,
	}
	if locationID > 0 {
		filter["location_id"] = locationID
	}
	if sectionID > 0 {
		filter["section_id"] = sectionID
	}
	if assetID > 0 {
		filter["id"] = assetID
	}

	assets, _, err := s.assetRepo.List(ctx, filter, 0, 10000)
	if err != nil {
		return nil, err
	}

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

	if category == model.AssetCategoryAPAR {
		return s.exportAPARChecksheet(ctx, f, sheetName, year, assets, locationName, sectionName)
	}

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

	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 11},
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
		Font:      &excelize.Font{Color: "16A34A", Bold: true, Size: 14},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
	})

	rejectedStyle, _ := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Font:      &excelize.Font{Color: "DC2626", Bold: true, Size: 14},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
	})

	waitingStyle, _ := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Font:      &excelize.Font{Color: "CA8A04", Bold: true, Size: 14},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
	})

	emptyStyle, _ := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Font:      &excelize.Font{Color: "9CA3AF", Size: 14},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
	})

	if category == model.AssetCategoryFireAlarm {
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

	var headers []string
	if category == model.AssetCategoryFireAlarm {
		headers = []string{"No", "Nama Aset", "Serial Number", "Lokasi", "Tipe Alarm", "Lokasi Panel"}
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

	for i := range headers {
		cell := colLetters[i] + "3"
		f.SetCellStyle(sheetName, cell, cell, headerStyle)
	}

	assetIDs := make([]int64, len(assets))
	for i, a := range assets {
		assetIDs[i] = a.ID
	}

	patrolsByAssetMonth := make(map[int64]map[int]string)
	anomalies := []AnomalyRecord{}

	for _, assetID := range assetIDs {
		patrolsByAssetMonth[assetID] = make(map[int]string)
	}

	startOfYear := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
	endOfYear := time.Date(year, 12, 31, 23, 59, 59, 0, time.UTC)

	patrols, _, err := s.patrolRepo.List(ctx, map[string]interface{}{
		"asset_ids": assetIDs,
		"date_from": startOfYear.Format("2006-01-02"),
		"date_to":   endOfYear.Format("2006-01-02"),
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

	for _, assetID := range assetIDs {
		details, err := s.detailRepo.ListByPatrolID(ctx, assetID)
		if err != nil {
			continue
		}
		for _, d := range details {
			if d.IsAnomaly {
				patrol, err := s.patrolRepo.FindByID(ctx, d.PatrolID)
				if err != nil {
					continue
				}
				if patrol.SubmittedAt != nil && patrol.SubmittedAt.Year() == year {
					paramName := fmt.Sprintf("Param #%d", d.HSEParameterID)
					anomalies = append(anomalies, AnomalyRecord{
						Date:      patrol.SubmittedAt.Format("2006-01-02"),
						Asset:     getAssetName(assets, patrol.AssetID),
						Parameter: paramName,
						Value:     d.Value,
						Notes:     d.Notes,
					})
				}
			}
		}
	}

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
		} else {
			startMonthCol = 4
		}

		for m := 1; m <= 12; m++ {
			col := colLetters[startMonthCol-1+m]
			cell := col + strconv.Itoa(row)
			symbol := patrolsByAssetMonth[asset.ID][m]
			if symbol == "" {
				symbol = "-"
			}
			f.SetCellValue(sheetName, cell, symbol)

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

		for c := 0; c < startMonthCol; c++ {
			cell := colLetters[c] + strconv.Itoa(row)
			f.SetCellStyle(sheetName, cell, cell, dataStyle)
		}
	}

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
		f.SetCellValue(sheet2, "G"+strconv.Itoa(row), "")
		for c := 0; c < len(anomalyHeaders); c++ {
			cell := colLetters[c] + strconv.Itoa(row)
			f.SetCellStyle(sheet2, cell, cell, dataStyle)
		}
	}

	for i := range colLetters[:len(headers)] {
		f.SetColWidth(sheetName, colLetters[i], colLetters[i], 15)
	}
	f.SetColWidth(sheetName, "B", "B", 30)
	f.SetColWidth(sheetName, "C", "C", 20)
	f.SetColWidth(sheetName, "D", "D", 20)
	if category == model.AssetCategoryFireAlarm {
		f.SetColWidth(sheetName, "E", "E", 20)
		f.SetColWidth(sheetName, "F", "F", 25)
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

func (s *exportService) exportAPARChecksheet(ctx context.Context, f *excelize.File, sheetName string, year int, assets []model.Asset, locationName, sectionName string) ([]byte, error) {
	params, err := s.hseParamRepo.FindByAssetCategory(ctx, model.AssetCategoryAPAR)
	if err != nil {
		return nil, err
	}

	colLetters := []string{
		"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
	}

	// Map system params to template columns
	// Template columns (A-M): Bulan, Tuas, Segel Tuas, Pin, Selang, Nozzle, Tekanan/Isi, Tabung, Tgl Kadaluarsa, Keterangan, Tgl Periksa, Paraf Pemilik Area, Paraf K3L
	// System params mapped: -, -, Segel Pin, -, -, -, Tekanan Gauge, Fisik Tabung, -, Catatan, -, -, -
	type colMapping struct {
		ParamName string
		ParamID   int64
	}
	colMap := make([]colMapping, 13)
	for i := range colMap {
		colMap[i].ParamID = 0
	}

	for _, p := range params {
		lower := strings.ToLower(p.ParameterName)
		switch {
		case lower == "tuas":
			colMap[1].ParamID = p.ID // B: Tuas
		case lower == "segel tuas":
			colMap[2].ParamID = p.ID // C: Segel Tuas
		case lower == "pin":
			colMap[3].ParamID = p.ID // D: Pin
		case lower == "selang":
			colMap[4].ParamID = p.ID // E: Selang
		case lower == "nozzle":
			colMap[5].ParamID = p.ID // F: Nozzle
		case lower == "tekanan/isi":
			colMap[6].ParamID = p.ID // G: Tekanan/Isi
		case lower == "tabung":
			colMap[7].ParamID = p.ID // H: Tabung
		case lower == "catatan tambahan":
			colMap[9].ParamID = p.ID // J: Keterangan
		}
	}

	months := []string{"Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"}

	templateHeaders := []string{
		"Bulan", "Tuas", "Segel Tuas", "Pin", "Selang", "Nozzle",
		"Tekanan/Isi", "Tabung", "Tanggal Kadaluarsa", "Keterangan",
		"Tanggal Periksa", "Paraf Pemilik Area", "Paraf K3L",
	}

	// Styles matching template
	titleStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 11, Family: "Arial"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})

	infoStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Size: 11, Family: "Arial"},
	})

	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 11, Family: "Arial"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: true},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
	})

	monthStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 11, Family: "Arial"},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
	})

	dataStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 11, Family: "Arial"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
	})

	okStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Color: "006100", Bold: true, Size: 11, Family: "Arial"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#C6EFCE"}, Pattern: 1},
	})

	notOkStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Color: "9C0006", Bold: true, Size: 11, Family: "Arial"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#FFC7CE"}, Pattern: 1},
	})

	naStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Color: "808080", Size: 11, Family: "Arial"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
	})

	footerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 10, Family: "Arial"},
		Alignment: &excelize.Alignment{Vertical: "center"},
	})

	footerBoldStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 10, Family: "Arial", Bold: true},
		Alignment: &excelize.Alignment{Vertical: "center"},
	})

	// Build patrol data
	assetIDs := make([]int64, len(assets))
	for i, a := range assets {
		assetIDs[i] = a.ID
	}

	startOfYear := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
	endOfYear := time.Date(year, 12, 31, 23, 59, 59, 0, time.UTC)

	patrols, _, err := s.patrolRepo.List(ctx, map[string]interface{}{
		"asset_ids": assetIDs,
		"date_from": startOfYear.Format("2006-01-02"),
		"date_to":   endOfYear.Format("2006-01-02"),
	}, 0, 10000)
	if err != nil {
		patrols = []model.Patrol{}
	}

	type patrolInfo struct {
		Patrol  model.Patrol
		Details []model.PatrolDetail
	}
	patrolByAssetMonth := make(map[int64]map[int]*patrolInfo)

	for _, p := range patrols {
		if p.SubmittedAt == nil {
			continue
		}
		month := int(p.SubmittedAt.Month())
		if patrolByAssetMonth[p.AssetID] == nil {
			patrolByAssetMonth[p.AssetID] = make(map[int]*patrolInfo)
		}
		existing, ok := patrolByAssetMonth[p.AssetID][month]
		if !ok || p.SubmittedAt.After(*existing.Patrol.SubmittedAt) {
			details, _ := s.detailRepo.ListByPatrolID(ctx, p.ID)
			patrolByAssetMonth[p.AssetID][month] = &patrolInfo{
				Patrol:  p,
				Details: details,
			}
		}
	}

	anomalies := []AnomalyRecord{}

	// Write one sheet per asset
	firstAsset := true
	for _, asset := range assets {
		var curSheet string
		if firstAsset {
			curSheet = sheetName
			firstAsset = false
		} else {
			curSheet = fmt.Sprintf("APAR - %s", truncateSheetName(asset.Name))
			f.NewSheet(curSheet)
		}

		// Row 1: Title
		f.MergeCell(curSheet, "A1", "M1")
		f.SetCellValue(curSheet, "A1", "CHECKSHEET INSPEKSI APAR")
		f.SetCellStyle(curSheet, "A1", "M1", titleStyle)

		// Row 2: empty

		// Row 3: Tahun
		f.MergeCell(curSheet, "A3", "L3")
		f.SetCellValue(curSheet, "A3", fmt.Sprintf("Tahun : %d", year))
		f.SetCellStyle(curSheet, "A3", "L3", infoStyle)

		// Row 4: Jenis APAR & Nomor APAR
		f.SetCellValue(curSheet, "A4", fmt.Sprintf("Jenis APAR : %s", asset.Name))
		f.SetCellStyle(curSheet, "A4", "A4", infoStyle)
		serial := ""
		if asset.SerialNumber != nil {
			serial = *asset.SerialNumber
		}
		f.SetCellValue(curSheet, "K4", fmt.Sprintf("Nomor APAR : %s", serial))
		f.SetCellStyle(curSheet, "K4", "K4", infoStyle)

		// Row 5: empty

		// Rows 6-7: Column headers (merged per column)
		for ci := range templateHeaders {
			topCell := colLetters[ci] + "6"
			botCell := colLetters[ci] + "7"
			f.MergeCell(curSheet, topCell, botCell)
			f.SetCellValue(curSheet, topCell, templateHeaders[ci])
			f.SetCellStyle(curSheet, topCell, botCell, headerStyle)
		}

		// Rows 8-31: 12 months, each in 2 merged rows
		for m := 0; m < 12; m++ {
			dataRow1 := 8 + m*2
			dataRow2 := 9 + m*2

			// Merge A (month) and apply border/style to both rows for all columns
			f.MergeCell(curSheet, fmt.Sprintf("A%d", dataRow1), fmt.Sprintf("A%d", dataRow2))
			f.SetCellValue(curSheet, fmt.Sprintf("A%d", dataRow1), months[m])
			f.SetCellStyle(curSheet, fmt.Sprintf("A%d", dataRow1), fmt.Sprintf("A%d", dataRow2), monthStyle)

			// Get data for this month
			monthNum := m + 1
			detailByParam := make(map[int64]model.PatrolDetail)
			var patrolDate string
			if pi, ok := patrolByAssetMonth[asset.ID][monthNum]; ok && pi != nil {
				for _, d := range pi.Details {
					detailByParam[d.HSEParameterID] = d
				}
				patrolDate = pi.Patrol.SubmittedAt.Format("2006-01-02")

				for _, d := range pi.Details {
					if d.IsAnomaly {
						paramName := fmt.Sprintf("Param #%d", d.HSEParameterID)
						for _, p := range params {
							if p.ID == d.HSEParameterID {
								paramName = p.ParameterName
								break
							}
						}
						anomalies = append(anomalies, AnomalyRecord{
							Date:      patrolDate,
							Asset:     asset.Name,
							Parameter: paramName,
							Value:     d.Value,
							Notes:     d.Notes,
						})
					}
				}
			}

			// Apply style and data to each column for both rows
			for ci := 1; ci < 13; ci++ {
				col := colLetters[ci]

				// Merge data cells (B-M) vertically for the 2-row month
				f.MergeCell(curSheet, fmt.Sprintf("%s%d", col, dataRow1), fmt.Sprintf("%s%d", col, dataRow2))

				cell := fmt.Sprintf("%s%d", col, dataRow1)

				switch ci {
				case 1: // B: Tuas
					writeParamValue(curSheet, f, cell, colMap[ci].ParamID, detailByParam, params, okStyle, notOkStyle, naStyle, dataStyle)
				case 2: // C: Segel Tuas
					writeParamValue(curSheet, f, cell, colMap[ci].ParamID, detailByParam, params, okStyle, notOkStyle, naStyle, dataStyle)
				case 3: // D: Pin
					writeParamValue(curSheet, f, cell, colMap[ci].ParamID, detailByParam, params, okStyle, notOkStyle, naStyle, dataStyle)
				case 4: // E: Selang
					writeParamValue(curSheet, f, cell, colMap[ci].ParamID, detailByParam, params, okStyle, notOkStyle, naStyle, dataStyle)
				case 5: // F: Nozzle
					writeParamValue(curSheet, f, cell, colMap[ci].ParamID, detailByParam, params, okStyle, notOkStyle, naStyle, dataStyle)
				case 6: // G: Tekanan/Isi
					writeParamValue(curSheet, f, cell, colMap[ci].ParamID, detailByParam, params, okStyle, notOkStyle, naStyle, dataStyle)
				case 7: // H: Tabung
					writeParamValue(curSheet, f, cell, colMap[ci].ParamID, detailByParam, params, okStyle, notOkStyle, naStyle, dataStyle)
				case 8: // I: Tanggal Kadaluarsa
					if asset.ExpiredAt != nil {
						f.SetCellValue(curSheet, cell, asset.ExpiredAt.Format("2006-01-02"))
					} else {
						f.SetCellValue(curSheet, cell, "-")
					}
					f.SetCellStyle(curSheet, cell, cell, dataStyle)
				case 9: // J: Keterangan - mapped from Label instruksi or Catatan tambahan
					writeParamValue(curSheet, f, cell, colMap[ci].ParamID, detailByParam, params, okStyle, notOkStyle, naStyle, dataStyle)
				case 10: // K: Tanggal Periksa
					if patrolDate != "" {
						f.SetCellValue(curSheet, cell, patrolDate)
					} else {
						f.SetCellValue(curSheet, cell, "-")
					}
					f.SetCellStyle(curSheet, cell, cell, dataStyle)
				case 11: // L: Paraf Pemilik Area
					f.SetCellStyle(curSheet, cell, cell, dataStyle)
				case 12: // M: Paraf K3L
					f.SetCellStyle(curSheet, cell, cell, dataStyle)
				}
			}
		}

		// Row 32: Form number
		f.SetCellValue(curSheet, "K32", "HSE - F - 15 A No. Rev : 01")
		f.MergeCell(curSheet, "K32", "M32")
		f.SetCellStyle(curSheet, "K32", "M32", footerStyle)

		// Row 33-35: APAR beroda
		f.SetCellValue(curSheet, "A33", "APAR beroda :")
		f.SetCellStyle(curSheet, "A33", "A33", footerBoldStyle)
		f.SetCellValue(curSheet, "C33", "Kondisi Ban")
		f.SetCellValue(curSheet, "C34", "Kondisi Velg")
		f.SetCellValue(curSheet, "C35", "Kondisi Tempat Tabung APAR")

		// Row 37: APAR CO2
		f.SetCellValue(curSheet, "A37", "APAR CO2   : 1.")
		f.SetCellStyle(curSheet, "A37", "A37", footerBoldStyle)
		f.SetCellValue(curSheet, "C37", "Kg            2.")
		f.SetCellValue(curSheet, "E37", "Kg")

		// Row 39-41: Note
		f.MergeCell(curSheet, "A39", "B39")
		f.SetCellValue(curSheet, "A39", "Note")
		f.SetCellStyle(curSheet, "A39", "A39", footerBoldStyle)
		f.MergeCell(curSheet, "C39", "H39")
		f.SetCellValue(curSheet, "C39", "O = Baik (Good)")
		f.SetCellStyle(curSheet, "C39", "C39", okStyle)
		f.MergeCell(curSheet, "C40", "H40")
		f.SetCellValue(curSheet, "C40", "X = Tidak Baik / Rusak (Not Good / Broken)")
		f.SetCellStyle(curSheet, "C40", "C40", notOkStyle)
		f.MergeCell(curSheet, "C41", "H41")
		f.SetCellValue(curSheet, "C41", "N/A = Tidak Ada (Not Available)")
		f.SetCellStyle(curSheet, "C41", "C41", naStyle)

		// Row 43-49: 7 inspection notes
		notes := []string{
			"1. Pastikan APAR tidak terhalang dan dalam kondisi siap digunakan;",
			"2. Pastikan APAR tidak mengalami kerusakan fisik, korosi/karat, atau cacat lainnya;",
			"3. Periksa tanggal kadaluarsa;",
			"4. Pastikan pressure dalam batas hijau;",
			"5. Pastikan APAR terdapat petunjuk pemakaian APAR dan tanda APAR;",
			"6. Bersihkan APAR bila dalam keadaan kotor dan berdebu;",
			"7. APAR jenis powder harus dibolak-balik sebanyak 3 - 5 kali.",
		}
		for ni, note := range notes {
			r := 43 + ni
			f.SetCellValue(curSheet, fmt.Sprintf("B%d", r), note)
			f.SetCellStyle(curSheet, fmt.Sprintf("B%d", r), fmt.Sprintf("B%d", r), footerStyle)
		}

		// Column widths matching template
		f.SetColWidth(curSheet, "A", "A", 11.3)
		f.SetColWidth(curSheet, "B", "B", 7.1)
		f.SetColWidth(curSheet, "C", "C", 8.4)
		f.SetColWidth(curSheet, "D", "D", 6.1)
		f.SetColWidth(curSheet, "E", "E", 8.4)
		f.SetColWidth(curSheet, "F", "F", 7.0)
		f.SetColWidth(curSheet, "G", "G", 9.7)
		f.SetColWidth(curSheet, "H", "H", 7.0)
		f.SetColWidth(curSheet, "I", "I", 13.6)
		f.SetColWidth(curSheet, "J", "J", 13.9)
		f.SetColWidth(curSheet, "K", "K", 10.1)
		f.SetColWidth(curSheet, "L", "L", 12.0)
		f.SetColWidth(curSheet, "M", "M", 12.0)

		// Set print area
		f.SetCellStyle(curSheet, "A1", "M49", dataStyle)
	}

	// Detail Temuan sheet
	sheet2 := "Detail Temuan"
	f.NewSheet(sheet2)
	anomalyHeaders := []string{"No", "Tanggal", "Aset", "Parameter", "Nilai", "Catatan", "Foto"}
	for i, h := range anomalyHeaders {
		cell := colLetters[i] + "1"
		f.SetCellValue(sheet2, cell, h)
		f.SetCellStyle(sheet2, cell, cell, headerStyle)
	}

	for i, a := range anomalies {
		aniRow := i + 2
		f.SetCellValue(sheet2, "A"+strconv.Itoa(aniRow), i+1)
		f.SetCellValue(sheet2, "B"+strconv.Itoa(aniRow), a.Date)
		f.SetCellValue(sheet2, "C"+strconv.Itoa(aniRow), a.Asset)
		f.SetCellValue(sheet2, "D"+strconv.Itoa(aniRow), a.Parameter)
		f.SetCellValue(sheet2, "E"+strconv.Itoa(aniRow), a.Value)
		f.SetCellValue(sheet2, "F"+strconv.Itoa(aniRow), a.Notes)
		f.SetCellValue(sheet2, "G"+strconv.Itoa(aniRow), "")
		for c := 0; c < len(anomalyHeaders); c++ {
			cell := colLetters[c] + strconv.Itoa(aniRow)
			f.SetCellStyle(sheet2, cell, cell, dataStyle)
		}
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

func writeParamValue(curSheet string, f *excelize.File, cell string, paramID int64, detailByParam map[int64]model.PatrolDetail, params []model.HSEParameter, okStyle, notOkStyle, naStyle, dataStyle int) {
	if paramID == 0 {
		f.SetCellValue(curSheet, cell, "-")
		f.SetCellStyle(curSheet, cell, cell, naStyle)
		return
	}
	detail, hasDetail := detailByParam[paramID]
	if hasDetail {
		inputType := getParamType(params, paramID)
		if inputType == model.InputTypeBoolean {
			switch detail.Value {
			case "X":
				f.SetCellValue(curSheet, cell, "X")
				f.SetCellStyle(curSheet, cell, cell, notOkStyle)
			case "N/A":
				f.SetCellValue(curSheet, cell, "N/A")
				f.SetCellStyle(curSheet, cell, cell, naStyle)
			default:
				f.SetCellValue(curSheet, cell, "O")
				f.SetCellStyle(curSheet, cell, cell, okStyle)
			}
		} else {
			f.SetCellValue(curSheet, cell, detail.Value)
			f.SetCellStyle(curSheet, cell, cell, dataStyle)
		}
	} else {
		f.SetCellValue(curSheet, cell, "-")
		f.SetCellStyle(curSheet, cell, cell, naStyle)
	}
}

func truncateSheetName(name string) string {
	// Excel sheet names are limited to 31 characters
	runes := []rune(name)
	if len(runes) > 28 {
		return string(runes[:28]) + "..."
	}
	return name
}

func getParamType(params []model.HSEParameter, id int64) model.InputType {
	for _, p := range params {
		if p.ID == id {
			return p.InputType
		}
	}
	return model.InputTypeBoolean
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

func (s *exportService) DownloadImportTemplate(ctx context.Context) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	sheet := "Template Import Aset"
	f.SetSheetName("Sheet1", sheet)

	// Write instruction header
	f.SetCellValue(sheet, "A1", "TEMPLATE IMPORT MASTER DATA ASET - PT. INSPECT HSE")
	f.SetCellValue(sheet, "A2", "Isi data sesuai format di bawah. Kolom bertanda * wajib diisi.")
	f.SetCellValue(sheet, "A3", "Kategori yang valid: APAR, HYDRANT, FIRE_ALARM")
	f.MergeCell(sheet, "A1", "I1")
	f.MergeCell(sheet, "A2", "I2")
	f.MergeCell(sheet, "A3", "I3")

	// Column headers
	headers := []string{"name*", "category*", "serial_number*", "location*", "pic", "section", "plant", "size", "expired_at"}
	colLetters := []string{
		"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
	}

	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF", Size: 11},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"#2563EB"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: true},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
		},
	})

	for i, h := range headers {
		cell := colLetters[i] + "5"
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, headerStyle)
	}

	// Example data row
	f.SetCellValue(sheet, "A6", "APAR Lt.1")
	f.SetCellValue(sheet, "B6", "APAR")
	f.SetCellValue(sheet, "C6", "APR-2024-001")
	f.SetCellValue(sheet, "D6", "Gedung Utama Lt.1")
	f.SetCellValue(sheet, "E6", "Budi Santoso")
	f.SetCellValue(sheet, "F6", "Produksi A")
	f.SetCellValue(sheet, "G6", "Plant A")
	f.SetCellValue(sheet, "H6", "4 kg")
	f.SetCellValue(sheet, "I6", "2025-12-31")

	// Add data validation for category column
	categoryRange := colLetters[1] + "6:" + colLetters[1] + "1005"
	_ = f.AddDataValidation(sheet, &excelize.DataValidation{
		Type:     "list",
		Formula1: `"APAR,HYDRANT,FIRE_ALARM"`,
		Sqref:    categoryRange,
	})

	// Auto fit columns
	for i := range headers {
		f.SetColWidth(sheet, colLetters[i], colLetters[i], 20)
	}
	f.SetColWidth(sheet, "A", "A", 25)

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
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

	// Support both old (location_id, pic_id, section_id) and new (location, pic, section) headers
	hasOldHeaders := false
	for _, h := range headers {
		lower := strings.ToLower(strings.TrimSpace(h))
		if lower == "location_id" || lower == "pic_id" || lower == "section_id" {
			hasOldHeaders = true
			break
		}
	}

	var required []string
	if hasOldHeaders {
		required = []string{"name", "category", "serial_number", "location_id"}
	} else {
		required = []string{"name", "category", "serial_number", "location"}
	}
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

		var locationName string
		var picName string
		var sectionName string
		if hasOldHeaders {
			locationName = getCol("location_id")
			picName = getCol("pic_id")
			sectionName = getCol("section_id")
		} else {
			locationName = getCol("location")
			picName = getCol("pic")
			sectionName = getCol("section")
		}

		plant := getCol("plant")
		size := getCol("size")
		expiredAtStr := getCol("expired_at")

		// Validate required fields
		if name == "" || category == "" || serialNumber == "" || locationName == "" {
			fieldName := "location"
			if hasOldHeaders {
				fieldName = "location_id"
			}
			result.Errors = append(result.Errors, ImportError{
				Row:   lineNum,
				Field: "required",
				Value: "",
				Error: fmt.Sprintf("kolom wajib (name, category, serial_number, %s) tidak boleh kosong", fieldName),
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
				Row:   lineNum,
				Field: "category",
				Value: category,
				Error: "kategori tidak valid (APAR, HYDRANT, FIRE_ALARM)",
			})
			continue
		}

		// Resolve location by name (or by ID if using old format)
		var locationID int64
		if hasOldHeaders {
			id, err := strconv.ParseInt(locationName, 10, 64)
			if err != nil {
				result.Errors = append(result.Errors, ImportError{
					Row:   lineNum,
					Field: "location_id",
					Value: locationName,
					Error: "location_id harus angka",
				})
				continue
			}
			loc, err := s.locationRepo.FindByID(ctx, id)
			if err != nil || loc == nil {
				result.Errors = append(result.Errors, ImportError{
					Row:   lineNum,
					Field: "location_id",
					Value: locationName,
					Error: "lokasi tidak ditemukan",
				})
				continue
			}
			locationID = loc.ID
		} else {
			loc, err := s.locationRepo.FindByName(ctx, locationName)
			if err != nil || loc == nil {
				result.Errors = append(result.Errors, ImportError{
					Row:   lineNum,
					Field: "location",
					Value: locationName,
					Error: "lokasi tidak ditemukan. Pastikan nama lokasi sesuai dengan master data.",
				})
				continue
			}
			locationID = loc.ID
		}

		var picID *int64
		if picName != "" {
			user, err := s.userRepo.FindByName(ctx, picName)
			if err != nil || user == nil {
				result.Errors = append(result.Errors, ImportError{
					Row:   lineNum,
					Field: "pic",
					Value: picName,
					Error: "PIC tidak ditemukan. Pastikan nama PIC sesuai dengan data user.",
				})
				continue
			}
			picID = &user.ID
		}

		var sectionID *int64
		if sectionName != "" {
			sec, err := s.sectionRepo.FindByName(ctx, sectionName)
			if err != nil || sec == nil {
				result.Errors = append(result.Errors, ImportError{
					Row:   lineNum,
					Field: "section",
					Value: sectionName,
					Error: "section tidak ditemukan. Pastikan nama section sesuai dengan master data.",
				})
				continue
			}
			sectionID = &sec.ID
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
					Row:   lineNum,
					Field: "expired_at",
					Value: expiredAtStr,
					Error: "format tanggal tidak valid (gunakan YYYY-MM-DD)",
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
				Row:   lineNum,
				Field: "all",
				Value: name,
				Error: err.Error(),
			})
			continue
		}

		result.Success++
	}

	return result, nil
}
