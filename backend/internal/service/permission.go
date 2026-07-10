package service

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
)

type permissionService struct {
	repo repository.PermissionRepository
}

func NewPermissionService(repo repository.PermissionRepository) PermissionService {
	return &permissionService{repo: repo}
}

func (s *permissionService) List(ctx context.Context) ([]model.Permission, error) {
	return s.repo.List(ctx)
}

func (s *permissionService) ListByModule(ctx context.Context) (map[string][]model.Permission, error) {
	return s.repo.ListByModule(ctx)
}
