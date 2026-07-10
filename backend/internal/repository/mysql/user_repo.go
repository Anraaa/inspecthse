package mysql

import (
	"context"
	"fmt"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/jmoiron/sqlx"
)

type UserRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByID(ctx context.Context, id int64) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u, "SELECT * FROM users WHERE id = ?", id)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return &u, nil
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u, "SELECT * FROM users WHERE email = ?", email)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return &u, nil
}

func (r *UserRepository) FindByNIP(ctx context.Context, nip string) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u, "SELECT * FROM users WHERE nip = ?", nip)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return &u, nil
}

func (r *UserRepository) Create(ctx context.Context, user *model.User) error {
	res, err := r.db.ExecContext(ctx,
		"INSERT INTO users (name, nip, email, password, role, section_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
		user.Name, user.NIP, user.Email, user.Password, user.Role, user.SectionID, user.IsActive,
	)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	user.ID = id
	return nil
}

func (r *UserRepository) Update(ctx context.Context, user *model.User) error {
	_, err := r.db.ExecContext(ctx,
		"UPDATE users SET name=?, nip=?, email=?, role=?, section_id=?, is_active=? WHERE id=?",
		user.Name, user.NIP, user.Email, user.Role, user.SectionID, user.IsActive, user.ID,
	)
	return err
}

func (r *UserRepository) FindByName(ctx context.Context, name string) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u, "SELECT * FROM users WHERE name = ?", name)
	if err != nil {
		return nil, fmt.Errorf("user not found by name: %w", err)
	}
	return &u, nil
}

func (r *UserRepository) List(ctx context.Context, offset, limit int) ([]model.User, int, error) {
	var total int
	r.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM users")

	var users []model.User
	err := r.db.SelectContext(ctx, &users, "SELECT * FROM users ORDER BY id LIMIT ? OFFSET ?", limit, offset)
	if err != nil {
		return nil, 0, err
	}
	return users, total, nil
}
