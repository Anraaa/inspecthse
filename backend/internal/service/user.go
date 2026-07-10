package service

import (
	"context"
	"errors"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type userService struct {
	repo   repository.UserRepository
	logSvc ActivityLogService
}

func NewUserService(repo repository.UserRepository, logSvc ActivityLogService) UserService {
	return &userService{repo: repo, logSvc: logSvc}
}

func (s *userService) Create(ctx context.Context, user *model.User) error {
	existing, _ := s.repo.FindByEmail(ctx, user.Email)
	if existing != nil {
		return errors.New("email sudah terdaftar")
	}
	existing, _ = s.repo.FindByNIP(ctx, user.NIP)
	if existing != nil {
		return errors.New("nip sudah terdaftar")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.Password = string(hash)

	err = s.repo.Create(ctx, user)
	if err != nil {
		return err
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "create", "user", user.ID, "", user.NIP, false)
	return nil
}

func (s *userService) Update(ctx context.Context, user *model.User) error {
	if user.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		user.Password = string(hash)
	}
	old, _ := s.repo.FindByID(ctx, user.ID)
	err := s.repo.Update(ctx, user)
	if err != nil {
		return err
	}
	oldVal := ""
	if old != nil {
		oldVal = old.Email
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "update", "user", user.ID, oldVal, user.Email, false)
	return nil
}

func (s *userService) GetByID(ctx context.Context, id int64) (*model.User, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *userService) List(ctx context.Context, offset, limit int) ([]model.User, int, error) {
	return s.repo.List(ctx, offset, limit)
}
