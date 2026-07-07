package service

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
)

type sectionService struct {
	repo repository.SectionRepository
}

func NewSectionService(repo repository.SectionRepository) SectionService {
	return &sectionService{repo: repo}
}

func (s *sectionService) Create(ctx context.Context, section *model.Section) error {
	return s.repo.Create(ctx, section)
}

func (s *sectionService) Update(ctx context.Context, section *model.Section) error {
	return s.repo.Update(ctx, section)
}

func (s *sectionService) Delete(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, id)
}

func (s *sectionService) GetByID(ctx context.Context, id int64) (*model.Section, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *sectionService) List(ctx context.Context) ([]model.Section, error) {
	return s.repo.List(ctx)
}
