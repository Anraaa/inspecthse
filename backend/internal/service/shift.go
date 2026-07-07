package service

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
)

type shiftService struct {
	repo   repository.ShiftRepository
	logSvc ActivityLogService
}

func NewShiftService(repo repository.ShiftRepository, logSvc ActivityLogService) ShiftService {
	return &shiftService{repo: repo, logSvc: logSvc}
}

func (s *shiftService) Create(ctx context.Context, shift *model.Shift) error {
	err := s.repo.Create(ctx, shift)
	if err != nil {
		return err
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "create", "shift", shift.ID, "", shift.Name, false)
	return nil
}

func (s *shiftService) Update(ctx context.Context, shift *model.Shift) error {
	old, _ := s.repo.FindByID(ctx, shift.ID)
	err := s.repo.Update(ctx, shift)
	if err != nil {
		return err
	}
	oldVal := ""
	if old != nil {
		oldVal = old.Name
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "update", "shift", shift.ID, oldVal, shift.Name, false)
	return nil
}

func (s *shiftService) Delete(ctx context.Context, id int64) error {
	old, _ := s.repo.FindByID(ctx, id)
	err := s.repo.Delete(ctx, id)
	if err != nil {
		return err
	}
	oldVal := ""
	if old != nil {
		oldVal = old.Name
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "delete", "shift", id, oldVal, "", false)
	return nil
}

func (s *shiftService) GetByID(ctx context.Context, id int64) (*model.Shift, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *shiftService) List(ctx context.Context) ([]model.Shift, error) {
	return s.repo.List(ctx)
}
