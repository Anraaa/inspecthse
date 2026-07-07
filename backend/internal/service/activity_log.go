package service

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
)

type activityLogService struct {
	repo repository.ActivityLogRepository
}

func NewActivityLogService(repo repository.ActivityLogRepository) ActivityLogService {
	return &activityLogService{repo: repo}
}

func (s *activityLogService) Log(ctx context.Context, userID int64, action, entity string, entityID int64, oldValue, newValue string, isGhost bool) error {
	return s.repo.Create(ctx, &model.ActivityLog{
		UserID:   userID,
		Action:   action,
		Entity:   entity,
		EntityID: entityID,
		OldValue: oldValue,
		NewValue: newValue,
		IsGhost:  isGhost,
	})
}

func (s *activityLogService) ListByUserID(ctx context.Context, userID int64, offset, limit int) ([]model.ActivityLog, int, error) {
	return s.repo.ListByUserID(ctx, userID, offset, limit)
}
