package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
)

type patrolService struct {
	patrolRepo      repository.PatrolRepository
	detailRepo      repository.PatrolDetailRepository
	attachmentRepo  repository.PatrolAttachmentRepository
	assetRepo       repository.AssetRepository
	alertSvc        AlertService
	activityLogRepo repository.ActivityLogRepository
	userRepo        repository.UserRepository
}

func NewPatrolService(
	patrolRepo repository.PatrolRepository,
	detailRepo repository.PatrolDetailRepository,
	attachmentRepo repository.PatrolAttachmentRepository,
	assetRepo repository.AssetRepository,
	alertSvc AlertService,
	activityLogRepo repository.ActivityLogRepository,
	userRepo repository.UserRepository,
) PatrolService {
	return &patrolService{
		patrolRepo:      patrolRepo,
		detailRepo:      detailRepo,
		attachmentRepo:  attachmentRepo,
		assetRepo:       assetRepo,
		alertSvc:        alertSvc,
		activityLogRepo: activityLogRepo,
		userRepo:        userRepo,
	}
}

func (s *patrolService) Create(ctx context.Context, patrol *model.Patrol, details []model.PatrolDetail, attachments []model.PatrolAttachment) error {
	existing, _ := s.patrolRepo.FindByClientUUID(ctx, patrol.ClientUUID)
	if existing != nil {
		return errors.New("patrol dengan data ini sudah pernah dikirim")
	}

	patrol.Status = model.PatrolStatusDraft
	patrolID, err := s.patrolRepo.Create(ctx, patrol)
	if err != nil {
		return err
	}
	patrol.ID = patrolID

	for i := range details {
		details[i].PatrolID = patrolID
	}
	if err := s.detailRepo.CreateBatch(ctx, details); err != nil {
		return err
	}

	for i := range attachments {
		attachments[i].PatrolID = patrolID
	}
	for _, att := range attachments {
		if err := s.attachmentRepo.Create(ctx, &att); err != nil {
			return err
		}
	}

	return nil
}

func (s *patrolService) Submit(ctx context.Context, patrolID int64) error {
	patrol, err := s.patrolRepo.FindByID(ctx, patrolID)
	if err != nil {
		return err
	}

	patrol.Status = model.PatrolStatusWaitingApproval
	now := time.Now()
	patrol.SubmittedAt = &now

	if err := s.patrolRepo.Update(ctx, patrol); err != nil {
		return err
	}

	s.activityLogRepo.Create(ctx, &model.ActivityLog{
		UserID:   patrol.UserID,
		Action:   "submit",
		Entity:   "patrol",
		EntityID: patrolID,
		NewValue: string(model.PatrolStatusWaitingApproval),
	})

	details, err := s.detailRepo.ListByPatrolID(ctx, patrolID)
	if err != nil {
		return nil
	}

	for _, d := range details {
		if d.IsAnomaly {
			asset, assetErr := s.assetRepo.FindByID(ctx, patrol.AssetID)
			if assetErr == nil && asset.PICID != nil {
				msg := fmt.Sprintf("Anomali terdeteksi pada patrol %d: parameter %d - %s", patrolID, d.HSEParameterID, d.Notes)
				s.alertSvc.CreateAnomalyAlert(ctx, patrolID, patrol.AssetID, *asset.PICID, msg)
			}
		}
	}

	return nil
}

func (s *patrolService) Approve(ctx context.Context, patrolID, approvedBy int64) error {
	patrol, err := s.patrolRepo.FindByID(ctx, patrolID)
	if err != nil {
		return err
	}

	patrol.Status = model.PatrolStatusApproved
	patrol.ApprovedBy = &approvedBy
	now := time.Now()
	patrol.ApprovedAt = &now

	if err := s.patrolRepo.Update(ctx, patrol); err != nil {
		return err
	}

	asset, _ := s.assetRepo.FindByID(ctx, patrol.AssetID)
	approver, _ := s.userRepo.FindByID(ctx, approvedBy)

	assetName := "aset"
	if asset != nil {
		assetName = asset.Name
	}
	approverName := ""
	if approver != nil {
		approverName = approver.Name
	}

	msg := fmt.Sprintf("Patroli %s pada %s telah disetujui oleh %s", assetName, patrol.CreatedAt.Format("2 Jan 2006"), approverName)
	s.alertSvc.CreateApprovalAlert(ctx, patrolID, patrol.AssetID, patrol.UserID, msg)

	s.activityLogRepo.Create(ctx, &model.ActivityLog{
		UserID:   approvedBy,
		Action:   "approve",
		Entity:   "patrol",
		EntityID: patrolID,
		NewValue: string(model.PatrolStatusApproved),
	})

	return nil
}

func (s *patrolService) Reject(ctx context.Context, patrolID, rejectedBy int64, reason string) error {
	patrol, err := s.patrolRepo.FindByID(ctx, patrolID)
	if err != nil {
		return err
	}

	patrol.Status = model.PatrolStatusRejected
	patrol.RejectionReason = &reason

	if err := s.patrolRepo.Update(ctx, patrol); err != nil {
		return err
	}

	asset, _ := s.assetRepo.FindByID(ctx, patrol.AssetID)
	rejector, _ := s.userRepo.FindByID(ctx, rejectedBy)

	assetName := "aset"
	if asset != nil {
		assetName = asset.Name
	}
	rejectorName := ""
	if rejector != nil {
		rejectorName = rejector.Name
	}

	msg := fmt.Sprintf("Patroli %s pada %s ditolak oleh %s. Alasan: %s", assetName, patrol.CreatedAt.Format("2 Jan 2006"), rejectorName, reason)
	s.alertSvc.CreateApprovalAlert(ctx, patrolID, patrol.AssetID, patrol.UserID, msg)

	s.activityLogRepo.Create(ctx, &model.ActivityLog{
		UserID:   rejectedBy,
		Action:   "reject",
		Entity:   "patrol",
		EntityID: patrolID,
		NewValue: string(model.PatrolStatusRejected),
	})

	return nil
}

func (s *patrolService) GetByID(ctx context.Context, id int64) (*PatrolDetailResponse, error) {
	patrol, err := s.patrolRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	details, err := s.detailRepo.ListByPatrolID(ctx, id)
	if err != nil {
		details = []model.PatrolDetail{}
	}
	attachments, err := s.attachmentRepo.ListByPatrolID(ctx, id)
	if err != nil {
		attachments = []model.PatrolAttachment{}
	}
	return &PatrolDetailResponse{
		Patrol:      patrol,
		Details:     details,
		Attachments: attachments,
	}, nil
}

func (s *patrolService) List(ctx context.Context, filter map[string]interface{}, offset, limit int) ([]model.Patrol, int, error) {
	return s.patrolRepo.List(ctx, filter, offset, limit)
}

func (s *patrolService) GhostEdit(ctx context.Context, patrolID int64, details []model.PatrolDetail, editedBy int64) error {
	_, err := s.patrolRepo.FindByID(ctx, patrolID)
	if err != nil {
		return err
	}

	for _, d := range details {
		if err := s.detailRepo.Update(ctx, &d); err != nil {
			return err
		}
		s.activityLogRepo.Create(ctx, &model.ActivityLog{
			UserID:   editedBy,
			Action:   "ghost_edit",
			Entity:   "patrol_detail",
			EntityID: d.ID,
			NewValue: d.Value,
			IsGhost:  true,
		})
	}

	return nil
}
