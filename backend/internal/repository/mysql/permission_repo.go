package mysql

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/jmoiron/sqlx"
)

type PermissionRepository struct {
	db *sqlx.DB
}

func NewPermissionRepository(db *sqlx.DB) *PermissionRepository {
	return &PermissionRepository{db: db}
}

func (r *PermissionRepository) List(ctx context.Context) ([]model.Permission, error) {
	var perms []model.Permission
	err := r.db.SelectContext(ctx, &perms, "SELECT * FROM permissions ORDER BY module, id")
	if err != nil {
		return nil, err
	}
	return perms, nil
}

func (r *PermissionRepository) ListByModule(ctx context.Context) (map[string][]model.Permission, error) {
	perms, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	result := make(map[string][]model.Permission)
	for _, p := range perms {
		result[p.Module] = append(result[p.Module], p)
	}
	return result, nil
}
