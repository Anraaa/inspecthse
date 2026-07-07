package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/anomalyco/inspecthse/internal/config"
	"github.com/anomalyco/inspecthse/internal/handler"
	"github.com/anomalyco/inspecthse/internal/repository/mysql"
	"github.com/anomalyco/inspecthse/internal/router"
	"github.com/anomalyco/inspecthse/internal/service"
	"github.com/anomalyco/inspecthse/pkg/database"
	"github.com/anomalyco/inspecthse/pkg/seeder"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"
)

func main() {
	logger := zerolog.New(os.Stderr).With().Timestamp().Logger()

	loadEnv()

	cfg := config.Load()

	db, err := database.NewMySQL(cfg.MySQLDSN())
	if err != nil {
		logger.Fatal().Err(err).Msg("gagal koneksi database")
	}
	defer db.Close()

	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr(),
	})
	defer rdb.Close()

	if err := database.RunMigrations(cfg.MySQLDSN(), "migrations"); err != nil {
		logger.Fatal().Err(err).Msg("gagal migrasi database")
	}
	logger.Info().Msg("migrasi database berhasil")

	seeder.Seed(db)

	// Repository initialization
	userRepo := mysql.NewUserRepository(db)
	assetRepo := mysql.NewAssetRepository(db)
	locationRepo := mysql.NewLocationRepository(db)
	sectionRepo := mysql.NewSectionRepository(db)
	shiftRepo := mysql.NewShiftRepository(db)
	hseParamRepo := mysql.NewHSEParameterRepository(db)
	patrolRepo := mysql.NewPatrolRepository(db)
	patrolDetailRepo := mysql.NewPatrolDetailRepository(db)
	patrolAttachmentRepo := mysql.NewPatrolAttachmentRepository(db)
	alertRepo := mysql.NewAlertRepository(db)
	activityLogRepo := mysql.NewActivityLogRepository(db)

	// Service initialization
	alertSvc := service.NewAlertService(alertRepo)
	authSvc := service.NewAuthService(userRepo, rdb, cfg)
	userSvc := service.NewUserService(userRepo)
	assetSvc := service.NewAssetService(assetRepo)
	locationSvc := service.NewLocationService(locationRepo)
	sectionSvc := service.NewSectionService(sectionRepo)
	shiftSvc := service.NewShiftService(shiftRepo)
	paramSvc := service.NewHSEParameterService(hseParamRepo)
	patrolSvc := service.NewPatrolService(patrolRepo, patrolDetailRepo, patrolAttachmentRepo, assetRepo, alertSvc, activityLogRepo)
	exportSvc := service.NewExportService(assetRepo, patrolRepo, patrolDetailRepo, locationRepo, sectionRepo)
	dashSvc := service.NewDashboardService(patrolRepo, assetRepo, userRepo)

	// Handler initialization
	authH := handler.NewAuthHandler(authSvc)
	assetH := handler.NewAssetHandler(assetSvc, locationSvc)
	patrolH := handler.NewPatrolHandler(patrolSvc)
	masterH := handler.NewMasterDataHandler(locationSvc, sectionSvc, shiftSvc, paramSvc, userSvc)
	dashH := handler.NewDashboardHandler(dashSvc)
	exportH := handler.NewExportHandler(exportSvc)

	r := router.New(cfg, authH, assetH, patrolH, masterH, dashH, exportH)

	addr := ":" + cfg.ServerPort
	logger.Info().Str("addr", addr).Msg("server starting")

	if err := http.ListenAndServe(addr, r); err != nil {
		logger.Fatal().Err(err).Msg("server error")
	}
}

func loadEnv() {
	paths := []string{
		".env",
		"../.env",
		"/home/anraaa/gawe/migrasi/InspectHSE/.env",
	}
	for _, p := range paths {
		abs, _ := filepath.Abs(p)
		if _, err := os.Stat(abs); err == nil {
			if err := godotenv.Load(abs); err == nil {
				log.Println("loaded env from", abs)
				return
			}
		}
	}
}
