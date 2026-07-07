package mysql

import (
	"context"
	"fmt"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/jmoiron/sqlx"
)

type SectionRepository struct {
	db *sqlx.DB
}

func NewSectionRepository(db *sqlx.DB) *SectionRepository {
	return &SectionRepository{db: db}
}

func (r *SectionRepository) FindByID(ctx context.Context, id int64) (*model.Section, error) {
	var s model.Section
	err := r.db.GetContext(ctx, &s, "SELECT * FROM sections WHERE id = ?", id)
	if err != nil {
		return nil, fmt.Errorf("section not found: %w", err)
	}
	return &s, nil
}

func (r *SectionRepository) Create(ctx context.Context, section *model.Section) error {
	res, err := r.db.ExecContext(ctx, "INSERT INTO sections (name, description) VALUES (?, ?)",
		section.Name, section.Description)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	section.ID = id
	return nil
}

func (r *SectionRepository) Update(ctx context.Context, section *model.Section) error {
	_, err := r.db.ExecContext(ctx, "UPDATE sections SET name=?, description=? WHERE id=?",
		section.Name, section.Description, section.ID)
	return err
}

func (r *SectionRepository) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM sections WHERE id = ?", id)
	return err
}

func (r *SectionRepository) List(ctx context.Context) ([]model.Section, error) {
	var sections []model.Section
	err := r.db.SelectContext(ctx, &sections, "SELECT * FROM sections ORDER BY id")
	if err != nil {
		return nil, err
	}
	return sections, nil
}
