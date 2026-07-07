package mysql

import (
	"context"
	"fmt"
	"strings"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/jmoiron/sqlx"
)

type PatrolRepository struct {
	db *sqlx.DB
}

func NewPatrolRepository(db *sqlx.DB) *PatrolRepository {
	return &PatrolRepository{db: db}
}

func (r *PatrolRepository) FindByID(ctx context.Context, id int64) (*model.Patrol, error) {
	var p model.Patrol
	err := r.db.GetContext(ctx, &p, "SELECT * FROM patrols WHERE id = ?", id)
	if err != nil {
		return nil, fmt.Errorf("patrol not found: %w", err)
	}
	return &p, nil
}

func (r *PatrolRepository) Create(ctx context.Context, patrol *model.Patrol) (int64, error) {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO patrols (user_id, asset_id, shift_id, status, client_uuid, submitted_at)
		VALUES (?, ?, ?, ?, ?, ?)`,
		patrol.UserID, patrol.AssetID, patrol.ShiftID, patrol.Status, patrol.ClientUUID, patrol.SubmittedAt,
	)
	if err != nil {
		return 0, err
	}
	id, _ := res.LastInsertId()
	return id, nil
}

func (r *PatrolRepository) Update(ctx context.Context, patrol *model.Patrol) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE patrols SET user_id=?, asset_id=?, shift_id=?, status=?, client_uuid=?,
		                   approved_by=?, approved_at=?, rejection_reason=?, submitted_at=?
		WHERE id=?`,
		patrol.UserID, patrol.AssetID, patrol.ShiftID, patrol.Status, patrol.ClientUUID,
		patrol.ApprovedBy, patrol.ApprovedAt, patrol.RejectionReason, patrol.SubmittedAt, patrol.ID,
	)
	return err
}

func (r *PatrolRepository) List(ctx context.Context, filter map[string]interface{}, offset, limit int) ([]model.Patrol, int, error) {
	where := "1=1"
	args := []interface{}{}

	if v, ok := filter["status"]; ok {
		where += " AND status = ?"
		args = append(args, v)
	}
	if v, ok := filter["user_id"]; ok {
		where += " AND user_id = ?"
		args = append(args, v)
	}
	if v, ok := filter["asset_id"]; ok {
		where += " AND asset_id = ?"
		args = append(args, v)
	}
	if v, ok := filter["location_id"]; ok {
		where += " AND asset_id IN (SELECT id FROM assets WHERE location_id = ?)"
		args = append(args, v)
	}
	if v, ok := filter["date_from"]; ok {
		where += " AND created_at >= ?"
		args = append(args, v)
	}
	if v, ok := filter["date_to"]; ok {
		where += " AND created_at <= ?"
		args = append(args, v)
	}
	if v, ok := filter["search"]; ok {
		s := fmt.Sprintf("%%%s%%", strings.TrimSpace(v.(string)))
		where += " AND (id LIKE ? OR client_uuid LIKE ?)"
		args = append(args, s, s)
	}

	var total int
	err := r.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM patrols WHERE "+where, args...)
	if err != nil {
		return nil, 0, err
	}

	var patrols []model.Patrol
	err = r.db.SelectContext(ctx, &patrols, "SELECT * FROM patrols WHERE "+where+" ORDER BY id DESC LIMIT ? OFFSET ?",
		append(args, limit, offset)...)
	if err != nil {
		return nil, 0, err
	}
	return patrols, total, nil
}

func (r *PatrolRepository) FindByClientUUID(ctx context.Context, uuid string) (*model.Patrol, error) {
	var p model.Patrol
	err := r.db.GetContext(ctx, &p, "SELECT * FROM patrols WHERE client_uuid = ?", uuid)
	if err != nil {
		return nil, fmt.Errorf("patrol not found: %w", err)
	}
	return &p, nil
}
