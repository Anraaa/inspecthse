package mysql

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/jmoiron/sqlx"
)

type AlertRepository struct {
	db *sqlx.DB
}

func NewAlertRepository(db *sqlx.DB) *AlertRepository {
	return &AlertRepository{db: db}
}

func (r *AlertRepository) Create(ctx context.Context, alert *model.Alert) error {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO alerts (patrol_id, asset_id, pic_id, message, is_read)
		VALUES (?, ?, ?, ?, ?)`,
		alert.PatrolID, alert.AssetID, alert.PICID, alert.Message, alert.IsRead,
	)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	alert.ID = id
	return nil
}

func (r *AlertRepository) ListByUserID(ctx context.Context, userID int64) ([]model.Alert, error) {
	var alerts []model.Alert
	err := r.db.SelectContext(ctx, &alerts, "SELECT * FROM alerts WHERE pic_id = ? ORDER BY created_at DESC", userID)
	if err != nil {
		return nil, err
	}
	return alerts, nil
}

func (r *AlertRepository) ListByUserIDWithFilter(ctx context.Context, userID int64, isRead *bool, offset, limit int) ([]model.Alert, int, error) {
	where := "pic_id = ?"
	args := []interface{}{userID}

	if isRead != nil {
		where += " AND is_read = ?"
		args = append(args, *isRead)
	}

	var total int
	err := r.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM alerts WHERE "+where, args...)
	if err != nil {
		return nil, 0, err
	}

	var alerts []model.Alert
	err = r.db.SelectContext(ctx, &alerts, "SELECT * FROM alerts WHERE "+where+" ORDER BY created_at DESC LIMIT ? OFFSET ?",
		append(args, limit, offset)...)
	if err != nil {
		return nil, 0, err
	}
	return alerts, total, nil
}

func (r *AlertRepository) UnreadCount(ctx context.Context, userID int64) (int, error) {
	var count int
	err := r.db.GetContext(ctx, &count, "SELECT COUNT(*) FROM alerts WHERE pic_id = ? AND is_read = FALSE", userID)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *AlertRepository) MarkAsRead(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, "UPDATE alerts SET is_read = true WHERE id = ?", id)
	return err
}

func (r *AlertRepository) MarkAllAsRead(ctx context.Context, userID int64) error {
	_, err := r.db.ExecContext(ctx, "UPDATE alerts SET is_read = true WHERE pic_id = ? AND is_read = FALSE", userID)
	return err
}
