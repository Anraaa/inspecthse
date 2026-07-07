package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	_ "github.com/go-sql-driver/mysql"
)

func RunMigrations(dsn, migrationsPath string) error {
	migrateDB, err := sql.Open("mysql", dsn+"&multiStatements=true")
	if err != nil {
		return fmt.Errorf("gagal open migration connection: %w", err)
	}
	defer migrateDB.Close()

	migrationsDir := migrationsPath
	if !filepath.IsAbs(migrationsPath) {
		wd, _ := os.Getwd()
		migrationsDir = filepath.Join(wd, migrationsPath)
	}

	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("gagal membaca direktori migration: %w", err)
	}

	var upFiles []string
	for _, f := range files {
		if !f.IsDir() && strings.HasSuffix(f.Name(), ".up.sql") {
			upFiles = append(upFiles, f.Name())
		}
	}
	sort.Strings(upFiles)

	if len(upFiles) == 0 {
		return fmt.Errorf("tidak ada file migration (.up.sql) ditemukan di %s", migrationsDir)
	}

	if err := ensureMigrationTable(migrateDB); err != nil {
		return fmt.Errorf("gagal membuat tabel tracking migration: %w", err)
	}

	for _, file := range upFiles {
		applied, err := isMigrationApplied(migrateDB, file)
		if err != nil {
			return fmt.Errorf("gagal cek status migration %s: %w", file, err)
		}
		if applied {
			log.Printf("migration %s already applied, skipping", file)
			continue
		}

		content, err := os.ReadFile(filepath.Join(migrationsDir, file))
		if err != nil {
			return fmt.Errorf("gagal membaca file migration %s: %w", file, err)
		}

		if _, err := migrateDB.Exec(string(content)); err != nil {
			return fmt.Errorf("gagal execute migration %s: %w", file, err)
		}

		if _, err := migrateDB.Exec("INSERT INTO schema_migrations (version) VALUES (?)", file); err != nil {
			return fmt.Errorf("gagal mencatat migration %s: %w", file, err)
		}

		log.Printf("migration %s applied successfully", file)
	}

	return nil
}

func ensureMigrationTable(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	return err
}

func isMigrationApplied(db *sql.DB, version string) (bool, error) {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM schema_migrations WHERE version = ?", version).Scan(&count)
	if err != nil {
		// Table might not exist yet
		return false, nil
	}
	return count > 0, nil
}
