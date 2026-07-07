package service

import (
	"context"
	"fmt"
	"time"

	"github.com/anomalyco/inspecthse/internal/repository"
)

type expiredAssetService struct {
	assetRepo repository.AssetRepository
	alertSvc  AlertService
}

func NewExpiredAssetService(assetRepo repository.AssetRepository, alertSvc AlertService) ExpiredAssetService {
	return &expiredAssetService{assetRepo: assetRepo, alertSvc: alertSvc}
}

func (s *expiredAssetService) CheckExpiredAssets(ctx context.Context) error {
	assets, err := s.assetRepo.FindExpiringAssets(ctx, 7)
	if err != nil {
		return err
	}

	now := time.Now()

	for _, asset := range assets {
		if asset.PICID == nil || asset.ExpiredAt == nil {
			continue
		}

		daysLeft := int(asset.ExpiredAt.Sub(now).Hours() / 24)
		if daysLeft < 0 {
			daysLeft = 0
		}

		serial := ""
		if asset.SerialNumber != nil {
			serial = *asset.SerialNumber
		}

		msg := fmt.Sprintf("Aset %s (%s) akan kadaluarsa pada %s (sisa %d hari). Segera lakukan perpanjangan.",
			asset.Name, serial, asset.ExpiredAt.Format("2 Jan 2006"), daysLeft)

		s.alertSvc.CreateExpiredAssetAlert(ctx, asset.ID, *asset.PICID, msg)
	}

	return nil
}
