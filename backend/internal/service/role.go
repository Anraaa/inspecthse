package service

import (
	"context"
	"errors"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
)

type roleService struct {
	repo   repository.RoleRepository
	logSvc ActivityLogService
}

func NewRoleService(repo repository.RoleRepository, logSvc ActivityLogService) RoleService {
	return &roleService{repo: repo, logSvc: logSvc}
}

func (s *roleService) List(ctx context.Context, offset, limit int) ([]model.RoleInfo, int, error) {
	return s.repo.List(ctx, offset, limit)
}

func (s *roleService) GetByID(ctx context.Context, id int64) (*model.RoleWithPermissions, error) {
	return s.repo.GetRoleWithPermissions(ctx, id)
}

func (s *roleService) Create(ctx context.Context, role *model.RoleInfo) error {
	if role.Name == "" {
		return errors.New("nama role harus diisi")
	}
	if role.DisplayName == "" {
		return errors.New("display name harus diisi")
	}
	existing, _ := s.repo.FindByName(ctx, role.Name)
	if existing != nil {
		return errors.New("nama role sudah ada")
	}
	err := s.repo.Create(ctx, role)
	if err != nil {
		return err
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "create", "role", role.ID, "", role.Name, false)
	return nil
}

func (s *roleService) Update(ctx context.Context, role *model.RoleInfo) error {
	if role.ID == 0 {
		return errors.New("id role tidak valid")
	}
	existing, err := s.repo.FindByID(ctx, role.ID)
	if err != nil {
		return errors.New("role tidak ditemukan")
	}
	err = s.repo.Update(ctx, role)
	if err != nil {
		return err
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "update", "role", role.ID, existing.Name, role.Name, false)
	return nil
}

func (s *roleService) Delete(ctx context.Context, id int64) error {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return errors.New("role tidak ditemukan")
	}
	if existing.IsSystem {
		return errors.New("tidak dapat menghapus role sistem")
	}
	err = s.repo.Delete(ctx, id)
	if err != nil {
		return err
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "delete", "role", id, existing.Name, "", false)
	return nil
}

func (s *roleService) GetPermissions(ctx context.Context, roleID int64) ([]model.Permission, error) {
	return s.repo.GetPermissions(ctx, roleID)
}

func (s *roleService) SetPermissions(ctx context.Context, roleID int64, permissionIDs []int64) error {
	_, err := s.repo.FindByID(ctx, roleID)
	if err != nil {
		return errors.New("role tidak ditemukan")
	}
	return s.repo.SetPermissions(ctx, roleID, permissionIDs)
}

func (s *roleService) GetPermissionsByRoleName(ctx context.Context, roleName string) ([]model.Permission, error) {
	role, err := s.repo.FindByName(ctx, roleName)
	if err != nil {
		return nil, err
	}
	return s.repo.GetPermissions(ctx, role.ID)
}
