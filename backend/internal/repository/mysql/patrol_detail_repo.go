package mysql

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/jmoiron/sqlx"
)

type PatrolDetailRepository struct {
	db *sqlx.DB
}

func NewPatrolDetailRepository(db *sqlx.DB) *PatrolDetailRepository {
	return &PatrolDetailRepository{db: db}
}

func (r *PatrolDetailRepository) CreateBatch(ctx context.Context, details []model.PatrolDetail) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.PrepareContext(ctx,
		"INSERT INTO patrol_details (patrol_id, hse_parameter_id, value, is_anomaly, notes) VALUES (?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, d := range details {
		if _, err := stmt.ExecContext(ctx, d.PatrolID, d.HSEParameterID, d.Value, d.IsAnomaly, d.Notes); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *PatrolDetailRepository) Update(ctx context.Context, detail *model.PatrolDetail) error {
	_, err := r.db.ExecContext(ctx,
		"UPDATE patrol_details SET value = ?, is_anomaly = ?, notes = ? WHERE id = ?",
		detail.Value, detail.IsAnomaly, detail.Notes, detail.ID)
	return err
}

func (r *PatrolDetailRepository) ListByPatrolID(ctx context.Context, patrolID int64) ([]model.PatrolDetail, error) {
	var details []model.PatrolDetail
	err := r.db.SelectContext(ctx, &details, "SELECT * FROM patrol_details WHERE patrol_id = ? ORDER BY id", patrolID)
	if err != nil {
		return nil, err
	}
	return details, nil
}
