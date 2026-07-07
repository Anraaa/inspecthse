package service

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
)

type shiftService struct {
	repo repository.ShiftRepository
}

func NewShiftService(repo repository.ShiftRepository) ShiftService {
	return &shiftService{repo: repo}
}

func (s *shiftService) Create(ctx context.Context, shift *model.Shift) error {
	return s.repo.Create(ctx, shift)
}

func (s *shiftService) Update(ctx context.Context, shift *model.Shift) error {
	return s.repo.Update(ctx, shift)
}

func (s *shiftService) Delete(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, id)
}

func (s *shiftService) GetByID(ctx context.Context, id int64) (*model.Shift, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *shiftService) List(ctx context.Context) ([]model.Shift, error) {
	return s.repo.List(ctx)
}
