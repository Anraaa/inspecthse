package service

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/repository"
)

type dashboardService struct {
	patrolRepo repository.PatrolRepository
	assetRepo  repository.AssetRepository
	userRepo   repository.UserRepository
}

func NewDashboardService(patrolRepo repository.PatrolRepository, assetRepo repository.AssetRepository, userRepo repository.UserRepository) DashboardService {
	return &dashboardService{
		patrolRepo: patrolRepo,
		assetRepo:  assetRepo,
		userRepo:   userRepo,
	}
}

func (s *dashboardService) GetSuperAdminStats(ctx context.Context) (map[string]interface{}, error) {
	_, totalPatrols, _ := s.patrolRepo.List(ctx, nil, 0, 1)
	_, totalAssets, _ := s.assetRepo.List(ctx, nil, 0, 1)
	_, totalUsers, _ := s.userRepo.List(ctx, 0, 1)

	return map[string]interface{}{
		"total_patrols": totalPatrols,
		"total_assets":  totalAssets,
		"total_users":   totalUsers,
	}, nil
}

func (s *dashboardService) GetK3LStats(ctx context.Context, userID int64) (map[string]interface{}, error) {
	return map[string]interface{}{
		"total_patrols": 0,
		"user_id":       userID,
	}, nil
}

func (s *dashboardService) GetTimHSEStats(ctx context.Context) (map[string]interface{}, error) {
	return map[string]interface{}{
		"total_patrols":     0,
		"pending_approvals": 0,
	}, nil
}
