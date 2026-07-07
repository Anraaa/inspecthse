package service

import (
	"context"
	"errors"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type userService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) Create(ctx context.Context, user *model.User) error {
	existing, _ := s.repo.FindByEmail(ctx, user.Email)
	if existing != nil {
		return errors.New("email sudah terdaftar")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.Password = string(hash)

	return s.repo.Create(ctx, user)
}

func (s *userService) Update(ctx context.Context, user *model.User) error {
	if user.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		user.Password = string(hash)
	}
	return s.repo.Update(ctx, user)
}

func (s *userService) GetByID(ctx context.Context, id int64) (*model.User, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *userService) List(ctx context.Context, offset, limit int) ([]model.User, int, error) {
	return s.repo.List(ctx, offset, limit)
}
