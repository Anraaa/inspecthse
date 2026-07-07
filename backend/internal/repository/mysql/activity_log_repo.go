package mysql

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/jmoiron/sqlx"
)

type ActivityLogRepository struct {
	db *sqlx.DB
}

func NewActivityLogRepository(db *sqlx.DB) *ActivityLogRepository {
	return &ActivityLogRepository{db: db}
}

func (r *ActivityLogRepository) Create(ctx context.Context, log *model.ActivityLog) error {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO activity_logs (user_id, action, entity, entity_id, old_value, new_value, is_ghost)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		log.UserID, log.Action, log.Entity, log.EntityID, log.OldValue, log.NewValue, log.IsGhost,
	)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	log.ID = id
	return nil
}

func (r *ActivityLogRepository) List(ctx context.Context, entity string, entityID int64, offset, limit int) ([]model.ActivityLog, int, error) {
	where := "1=1"
	args := []interface{}{}

	if entity != "" {
		where += " AND entity = ?"
		args = append(args, entity)

		if entityID > 0 {
			where += " AND entity_id = ?"
			args = append(args, entityID)
		}
	}

	var total int
	err := r.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM activity_logs WHERE "+where, args...)
	if err != nil {
		return nil, 0, err
	}

	var logs []model.ActivityLog
	err = r.db.SelectContext(ctx, &logs, "SELECT * FROM activity_logs WHERE "+where+" ORDER BY created_at DESC LIMIT ? OFFSET ?",
		append(args, limit, offset)...)
	if err != nil {
		return nil, 0, err
	}
	return logs, total, nil
}
