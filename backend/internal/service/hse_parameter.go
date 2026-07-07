package service

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
)

type hseParameterService struct {
	repo repository.HSEParameterRepository
}

func NewHSEParameterService(repo repository.HSEParameterRepository) HSEParameterService {
	return &hseParameterService{repo: repo}
}

func (s *hseParameterService) Create(ctx context.Context, param *model.HSEParameter) error {
	return s.repo.Create(ctx, param)
}

func (s *hseParameterService) Update(ctx context.Context, param *model.HSEParameter) error {
	return s.repo.Update(ctx, param)
}

func (s *hseParameterService) Delete(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, id)
}

func (s *hseParameterService) GetByID(ctx context.Context, id int64) (*model.HSEParameter, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *hseParameterService) GetByAssetCategory(ctx context.Context, category model.AssetCategory) ([]model.HSEParameter, error) {
	return s.repo.FindByAssetCategory(ctx, category)
}

func (s *hseParameterService) List(ctx context.Context) ([]model.HSEParameter, error) {
	return s.repo.List(ctx)
}
