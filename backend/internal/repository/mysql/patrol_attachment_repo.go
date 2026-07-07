package mysql

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/jmoiron/sqlx"
)

type PatrolAttachmentRepository struct {
	db *sqlx.DB
}

func NewPatrolAttachmentRepository(db *sqlx.DB) *PatrolAttachmentRepository {
	return &PatrolAttachmentRepository{db: db}
}

func (r *PatrolAttachmentRepository) Create(ctx context.Context, attachment *model.PatrolAttachment) error {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO patrol_attachments (patrol_id, patrol_detail_id, file_path, attachment_type, is_live_capture)
		VALUES (?, ?, ?, ?, ?)`,
		attachment.PatrolID, attachment.PatrolDetailID, attachment.FilePath,
		attachment.AttachmentType, attachment.IsLiveCapture,
	)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	attachment.ID = id
	return nil
}

func (r *PatrolAttachmentRepository) ListByPatrolID(ctx context.Context, patrolID int64) ([]model.PatrolAttachment, error) {
	var attachments []model.PatrolAttachment
	err := r.db.SelectContext(ctx, &attachments, "SELECT * FROM patrol_attachments WHERE patrol_id = ? ORDER BY id", patrolID)
	if err != nil {
		return nil, err
	}
	return attachments, nil
}
