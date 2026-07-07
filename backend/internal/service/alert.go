package service

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
)

type alertService struct {
	repo repository.AlertRepository
}

func NewAlertService(repo repository.AlertRepository) AlertService {
	return &alertService{repo: repo}
}

func (s *alertService) CreateAnomalyAlert(ctx context.Context, patrolID, assetID, picID int64, message string) error {
	return s.repo.Create(ctx, &model.Alert{
		PatrolID: patrolID,
		AssetID:  assetID,
		PICID:    picID,
		Message:  message,
	})
}

func (s *alertService) ListByUserID(ctx context.Context, userID int64) ([]model.Alert, error) {
	return s.repo.ListByUserID(ctx, userID)
}

func (s *alertService) MarkAsRead(ctx context.Context, id int64) error {
	return s.repo.MarkAsRead(ctx, id)
}
