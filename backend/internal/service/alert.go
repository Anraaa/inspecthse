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

func (s *alertService) CreateApprovalAlert(ctx context.Context, patrolID, assetID, userID int64, message string) error {
	return s.repo.Create(ctx, &model.Alert{
		PatrolID: patrolID,
		AssetID:  assetID,
		PICID:    userID,
		Message:  message,
	})
}

func (s *alertService) CreateExpiredAssetAlert(ctx context.Context, assetID, picID int64, message string) error {
	return s.repo.Create(ctx, &model.Alert{
		AssetID: assetID,
		PICID:   picID,
		Message: message,
	})
}

func (s *alertService) ListByUserID(ctx context.Context, userID int64) ([]model.Alert, error) {
	return s.repo.ListByUserID(ctx, userID)
}

func (s *alertService) ListByUserIDWithFilter(ctx context.Context, userID int64, isRead *bool, offset, limit int) ([]model.Alert, int, error) {
	return s.repo.ListByUserIDWithFilter(ctx, userID, isRead, offset, limit)
}

func (s *alertService) UnreadCount(ctx context.Context, userID int64) (int, error) {
	return s.repo.UnreadCount(ctx, userID)
}

func (s *alertService) MarkAsRead(ctx context.Context, id int64) error {
	return s.repo.MarkAsRead(ctx, id)
}

func (s *alertService) MarkAllAsRead(ctx context.Context, userID int64) error {
	return s.repo.MarkAllAsRead(ctx, userID)
}
