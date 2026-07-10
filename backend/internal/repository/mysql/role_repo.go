package mysql

import (
	"context"
	"fmt"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/jmoiron/sqlx"
)

type RoleRepository struct {
	db *sqlx.DB
}

func NewRoleRepository(db *sqlx.DB) *RoleRepository {
	return &RoleRepository{db: db}
}

func (r *RoleRepository) FindByID(ctx context.Context, id int64) (*model.RoleInfo, error) {
	var role model.RoleInfo
	err := r.db.GetContext(ctx, &role, "SELECT * FROM roles WHERE id = ?", id)
	if err != nil {
		return nil, fmt.Errorf("role not found: %w", err)
	}
	return &role, nil
}

func (r *RoleRepository) FindByName(ctx context.Context, name string) (*model.RoleInfo, error) {
	var role model.RoleInfo
	err := r.db.GetContext(ctx, &role, "SELECT * FROM roles WHERE name = ?", name)
	if err != nil {
		return nil, fmt.Errorf("role not found: %w", err)
	}
	return &role, nil
}

func (r *RoleRepository) List(ctx context.Context, offset, limit int) ([]model.RoleInfo, int, error) {
	var total int
	err := r.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM roles")
	if err != nil {
		return nil, 0, err
	}

	var roles []model.RoleInfo
	err = r.db.SelectContext(ctx, &roles, "SELECT * FROM roles ORDER BY id LIMIT ? OFFSET ?", limit, offset)
	if err != nil {
		return nil, 0, err
	}
	return roles, total, nil
}

func (r *RoleRepository) Create(ctx context.Context, role *model.RoleInfo) error {
	res, err := r.db.ExecContext(ctx,
		"INSERT INTO roles (name, display_name, description, is_system) VALUES (?, ?, ?, ?)",
		role.Name, role.DisplayName, role.Description, role.IsSystem,
	)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	role.ID = id
	return nil
}

func (r *RoleRepository) Update(ctx context.Context, role *model.RoleInfo) error {
	_, err := r.db.ExecContext(ctx,
		"UPDATE roles SET name=?, display_name=?, description=? WHERE id=?",
		role.Name, role.DisplayName, role.Description, role.ID,
	)
	return err
}

func (r *RoleRepository) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM roles WHERE id=? AND is_system=FALSE", id)
	return err
}

func (r *RoleRepository) GetPermissions(ctx context.Context, roleID int64) ([]model.Permission, error) {
	var perms []model.Permission
	err := r.db.SelectContext(ctx, &perms,
		`SELECT p.* FROM permissions p
		 JOIN role_permissions rp ON rp.permission_id = p.id
		 WHERE rp.role_id = ?
		 ORDER BY p.module, p.id`, roleID)
	if err != nil {
		return nil, err
	}
	return perms, nil
}

func (r *RoleRepository) SetPermissions(ctx context.Context, roleID int64, permissionIDs []int64) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, "DELETE FROM role_permissions WHERE role_id = ?", roleID)
	if err != nil {
		return err
	}

	for _, pid := range permissionIDs {
		_, err = tx.ExecContext(ctx,
			"INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
			roleID, pid)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *RoleRepository) GetRoleWithPermissions(ctx context.Context, roleID int64) (*model.RoleWithPermissions, error) {
	role, err := r.FindByID(ctx, roleID)
	if err != nil {
		return nil, err
	}
	perms, err := r.GetPermissions(ctx, roleID)
	if err != nil {
		return nil, err
	}
	return &model.RoleWithPermissions{
		RoleInfo:    *role,
		Permissions: perms,
	}, nil
}
