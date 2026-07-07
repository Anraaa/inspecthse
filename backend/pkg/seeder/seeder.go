package seeder

import (
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

func Seed(db *sqlx.DB) {
	if isSeeded(db) {
		log.Println("seeder: data already exists, skipping")
		return
	}

	log.Println("seeder: inserting seed data...")

	seedSections(db)
	seedLocations(db)
	seedShifts(db)
	seedUsers(db)
	seedAssets(db)
	seedHSEParameters(db)

	log.Println("seeder: seed data inserted successfully")
}

func isSeeded(db *sqlx.DB) bool {
	var count int
	if err := db.Get(&count, "SELECT COUNT(*) FROM sections"); err != nil || count > 0 {
		return true
	}
	return false
}

func seedSections(db *sqlx.DB) {
	sections := []struct {
		Name        string
		Description string
	}{
		{"Produksi", "Departemen produksi"},
		{"Maintenance", "Departemen maintenance"},
		{"Gudang", "Departemen gudang dan logistik"},
	}

	for _, s := range sections {
		db.Exec("INSERT IGNORE INTO sections (name, description) VALUES (?, ?)", s.Name, s.Description)
	}
	fmt.Println("  seeded 3 sections")
}

func seedLocations(db *sqlx.DB) {
	locations := []struct {
		Name        string
		Description string
	}{
		{"Area A", "Area produksi A"},
		{"Area B", "Area produksi B"},
		{"Area C", "Area gudang bahan baku"},
		{"Area D", "Area gudang jadi"},
	}

	for _, l := range locations {
		db.Exec("INSERT IGNORE INTO locations (name, description) VALUES (?, ?)", l.Name, l.Description)
	}
	fmt.Println("  seeded 4 locations")
}

func seedShifts(db *sqlx.DB) {
	shifts := []struct {
		Name      string
		StartTime string
		EndTime   string
	}{
		{"Pagi", "06:00", "14:00"},
		{"Siang", "14:00", "22:00"},
		{"Malam", "22:00", "06:00"},
	}

	for _, s := range shifts {
		db.Exec("INSERT IGNORE INTO shifts (name, start_time, end_time) VALUES (?, ?, ?)", s.Name, s.StartTime, s.EndTime)
	}
	fmt.Println("  seeded 3 shifts")
}

func seedUsers(db *sqlx.DB) {
	users := []struct {
		Name      string
		Email     string
		Password  string
		Role      string
		SectionID int
	}{
		{"Admin Utama", "admin@inspecthse.com", "admin123", "SUPER_ADMIN", 1},
		{"Budi K3L", "budi@inspecthse.com", "k3l123", "K3L", 1},
		{"Ani K3L", "ani@inspecthse.com", "k3l123", "K3L", 2},
		{"Citra HSE", "citra@inspecthse.com", "hse123", "TIM_HSE", 1},
	}

	for _, u := range users {
		hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("  failed to hash password for %s: %v", u.Email, err)
			continue
		}
		_, err = db.Exec(
			"INSERT IGNORE INTO users (name, email, password, role, section_id, is_active) VALUES (?, ?, ?, ?, ?, TRUE)",
			u.Name, u.Email, string(hash), u.Role, u.SectionID,
		)
		if err != nil {
			log.Printf("  failed to insert user %s: %v", u.Email, err)
		}
	}
	fmt.Println("  seeded 4 users")
}

func seedAssets(db *sqlx.DB) {
	assets := []struct {
		Name       string
		Category   string
		SerialNo   string
		LocationID int
		SectionID  int
		QRCode     string
		ExpiredAt  string
	}{
		{"APAR CO2 5kg", "APAR", "APR-001-2026", 1, 1, "APR-001-2026", "2027-06-01"},
		{"APAR Serbuk 3kg", "APAR", "APR-002-2026", 2, 1, "APR-002-2026", "2027-06-01"},
		{"Hydrant Indoor A", "HYDRANT", "HYD-001-2026", 1, 1, "HYD-001-2026", "2027-01-01"},
		{"Hydrant Outdoor B", "HYDRANT", "HYD-002-2026", 3, 2, "HYD-002-2026", "2027-01-01"},
		{"Fire Alarm Manual", "FIRE_ALARM", "FA-001-2026", 2, 1, "FA-001-2026", "2026-12-01"},
		{"Fire Alarm Auto Panel", "FIRE_ALARM", "FA-002-2026", 4, 3, "FA-002-2026", "2026-12-01"},
	}

	for _, a := range assets {
		_, err := db.Exec(
			`INSERT IGNORE INTO assets (name, asset_category, serial_number, location_id, section_id, qr_code, expired_at, is_active)
			 VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
			a.Name, a.Category, a.SerialNo, a.LocationID, a.SectionID, a.QRCode, a.ExpiredAt,
		)
		if err != nil {
			log.Printf("  failed to insert asset %s: %v", a.Name, err)
		}
	}
	fmt.Println("  seeded 6 assets")
}

func seedHSEParameters(db *sqlx.DB) {
	params := []struct {
		Category string
		Name     string
		Type     string
		Unit     string
		Options  string
		Check    string
		Order    int
		Required bool
	}{
		// APAR parameters
		{"APAR", "Kondisi fisik tabung (tidak penyok/karat)", "boolean", "", "", "fisik", 1, true},
		{"APAR", "Tekanan gauge dalam zona hijau", "boolean", "", "", "fisik", 2, true},
		{"APAR", "Segel pin pengaman masih utuh", "boolean", "", "", "fisik", 3, true},
		{"APAR", "Label instruksi terbaca jelas", "boolean", "", "", "fisik", 4, true},
		{"APAR", "Akses ke APAR tidak terhalang", "boolean", "", "", "fisik", 5, true},
		{"APAR", "Berat tabung (kg)", "numeric", "kg", "", "fisik", 6, false},
		{"APAR", "Catatan tambahan", "text", "", "", "fisik", 7, false},

		// Hydrant parameters
		{"HYDRANT", "Kondisi fisik box hydrant", "boolean", "", "", "fisik", 1, true},
		{"HYDRANT", "Selang dalam kondisi baik", "boolean", "", "", "fisik", 2, true},
		{"HYDRANT", "Nozzle tersedia dan berfungsi", "boolean", "", "", "fisik", 3, true},
		{"HYDRANT", "Tekanan air normal", "boolean", "", "", "fungsi", 4, true},
		{"HYDRANT", "Katup (valve) berfungsi baik", "boolean", "", "", "fungsi", 5, true},
		{"HYDRANT", "Akses ke hydrant tidak terhalang", "boolean", "", "", "fisik", 6, true},
		{"HYDRANT", "Kondisi seal/karet", "option", "", "Baik,Kerusakan Ringan,Perlu Ganti", "fisik", 7, true},

		// Fire Alarm parameters
		{"FIRE_ALARM", "Indikator panel alarm menyala normal", "boolean", "", "", "fisik", 1, true},
		{"FIRE_ALARM", "Sirine/bell berfungsi", "boolean", "", "", "fungsi", 2, true},
		{"FIRE_ALARM", "Detektor asap bersih", "boolean", "", "", "fisik", 3, true},
		{"FIRE_ALARM", "Detektor panas berfungsi", "boolean", "", "", "fungsi", 4, true},
		{"FIRE_ALARM", "Tombol manual alarm (MCP) berfungsi", "boolean", "", "", "fungsi", 5, true},
		{"FIRE_ALARM", "Baterai backup berfungsi", "boolean", "", "", "fungsi", 6, true},
		{"FIRE_ALARM", "Tegangan panel (V)", "numeric", "V", "", "fisik", 7, false},
		{"FIRE_ALARM", "Lokasi panel", "text", "", "", "fisik", 8, false},
	}

	for _, p := range params {
		required := 0
		if p.Required {
			required = 1
		}
		_, err := db.Exec(
			`INSERT IGNORE INTO hse_parameters (asset_category, parameter_name, input_type, unit, options, check_type, sort_order, is_required)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			p.Category, p.Name, p.Type, p.Unit, p.Options, p.Check, p.Order, required,
		)
		if err != nil {
			log.Printf("  failed to insert parameter '%s': %v", p.Name, err)
		}
	}
	fmt.Println("  seeded 22 HSE parameters")
}
