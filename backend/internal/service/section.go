package service

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
)

type sectionService struct {
	repo   repository.SectionRepository
	logSvc ActivityLogService
}

func NewSectionService(repo repository.SectionRepository, logSvc ActivityLogService) SectionService {
	return &sectionService{repo: repo, logSvc: logSvc}
}

func (s *sectionService) Create(ctx context.Context, section *model.Section) error {
	err := s.repo.Create(ctx, section)
	if err != nil {
		return err
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "create", "section", section.ID, "", section.Name, false)
	return nil
}

func (s *sectionService) Update(ctx context.Context, section *model.Section) error {
	old, _ := s.repo.FindByID(ctx, section.ID)
	err := s.repo.Update(ctx, section)
	if err != nil {
		return err
	}
	oldVal := ""
	if old != nil {
		oldVal = old.Name
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "update", "section", section.ID, oldVal, section.Name, false)
	return nil
}

func (s *sectionService) Delete(ctx context.Context, id int64) error {
	old, _ := s.repo.FindByID(ctx, id)
	err := s.repo.Delete(ctx, id)
	if err != nil {
		return err
	}
	oldVal := ""
	if old != nil {
		oldVal = old.Name
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "delete", "section", id, oldVal, "", false)
	return nil
}

func (s *sectionService) GetByID(ctx context.Context, id int64) (*model.Section, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *sectionService) List(ctx context.Context, offset, limit int) ([]model.Section, int, error) {
	return s.repo.List(ctx, offset, limit)
}
