package mysql

import (
	"context"
	"fmt"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/jmoiron/sqlx"
)

type ShiftRepository struct {
	db *sqlx.DB
}

func NewShiftRepository(db *sqlx.DB) *ShiftRepository {
	return &ShiftRepository{db: db}
}

func (r *ShiftRepository) FindByID(ctx context.Context, id int64) (*model.Shift, error) {
	var s model.Shift
	err := r.db.GetContext(ctx, &s, "SELECT * FROM shifts WHERE id = ?", id)
	if err != nil {
		return nil, fmt.Errorf("shift not found: %w", err)
	}
	return &s, nil
}

func (r *ShiftRepository) Create(ctx context.Context, shift *model.Shift) error {
	res, err := r.db.ExecContext(ctx, "INSERT INTO shifts (name, start_time, end_time) VALUES (?, ?, ?)",
		shift.Name, shift.StartTime, shift.EndTime)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	shift.ID = id
	return nil
}

func (r *ShiftRepository) Update(ctx context.Context, shift *model.Shift) error {
	_, err := r.db.ExecContext(ctx, "UPDATE shifts SET name=?, start_time=?, end_time=? WHERE id=?",
		shift.Name, shift.StartTime, shift.EndTime, shift.ID)
	return err
}

func (r *ShiftRepository) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM shifts WHERE id = ?", id)
	return err
}

func (r *ShiftRepository) List(ctx context.Context) ([]model.Shift, error) {
	var shifts []model.Shift
	err := r.db.SelectContext(ctx, &shifts, "SELECT * FROM shifts ORDER BY id")
	if err != nil {
		return nil, err
	}
	return shifts, nil
}
