package service

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
)

type hseParameterService struct {
	repo   repository.HSEParameterRepository
	logSvc ActivityLogService
}

func NewHSEParameterService(repo repository.HSEParameterRepository, logSvc ActivityLogService) HSEParameterService {
	return &hseParameterService{repo: repo, logSvc: logSvc}
}

func (s *hseParameterService) Create(ctx context.Context, param *model.HSEParameter) error {
	err := s.repo.Create(ctx, param)
	if err != nil {
		return err
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "create", "hse_parameter", param.ID, "", param.ParameterName, false)
	return nil
}

func (s *hseParameterService) Update(ctx context.Context, param *model.HSEParameter) error {
	old, _ := s.repo.FindByID(ctx, param.ID)
	err := s.repo.Update(ctx, param)
	if err != nil {
		return err
	}
	oldVal := ""
	if old != nil {
		oldVal = old.ParameterName
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "update", "hse_parameter", param.ID, oldVal, param.ParameterName, false)
	return nil
}

func (s *hseParameterService) Delete(ctx context.Context, id int64) error {
	old, _ := s.repo.FindByID(ctx, id)
	err := s.repo.Delete(ctx, id)
	if err != nil {
		return err
	}
	oldVal := ""
	if old != nil {
		oldVal = old.ParameterName
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "delete", "hse_parameter", id, oldVal, "", false)
	return nil
}

func (s *hseParameterService) GetByID(ctx context.Context, id int64) (*model.HSEParameter, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *hseParameterService) GetByAssetCategory(ctx context.Context, category model.AssetCategory) ([]model.HSEParameter, error) {
	return s.repo.FindByAssetCategory(ctx, category)
}

func (s *hseParameterService) List(ctx context.Context, offset, limit int) ([]model.HSEParameter, int, error) {
	return s.repo.List(ctx, offset, limit)
}
