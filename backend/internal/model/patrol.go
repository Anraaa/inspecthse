package model

import "time"

type PatrolStatus string

const (
	PatrolStatusDraft          PatrolStatus = "draft"
	PatrolStatusSubmitted      PatrolStatus = "submitted"
	PatrolStatusWaitingApproval PatrolStatus = "waiting_approval"
	PatrolStatusApproved       PatrolStatus = "approved"
	PatrolStatusRejected       PatrolStatus = "rejected"
)

type Patrol struct {
	ID              int64        `db:"id" json:"id"`
	UserID          int64        `db:"user_id" json:"user_id"`
	AssetID         int64        `db:"asset_id" json:"asset_id"`
	ShiftID         int64        `db:"shift_id" json:"shift_id"`
	Status          PatrolStatus `db:"status" json:"status"`
	ClientUUID      string       `db:"client_uuid" json:"client_uuid"`
	ApprovedBy      *int64       `db:"approved_by" json:"approved_by"`
	ApprovedAt      *time.Time   `db:"approved_at" json:"approved_at"`
	RejectionReason *string      `db:"rejection_reason" json:"rejection_reason"`
	SubmittedAt     *time.Time   `db:"submitted_at" json:"submitted_at"`
	CreatedAt       time.Time    `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time    `db:"updated_at" json:"updated_at"`
}

type PatrolDetail struct {
	ID             int64  `db:"id" json:"id"`
	PatrolID       int64  `db:"patrol_id" json:"patrol_id"`
	HSEParameterID int64  `db:"hse_parameter_id" json:"hse_parameter_id"`
	Value          string `db:"value" json:"value"`
	IsAnomaly      bool   `db:"is_anomaly" json:"is_anomaly"`
	Notes          string `db:"notes" json:"notes"`
}

type PatrolAttachment struct {
	ID             int64  `db:"id" json:"id"`
	PatrolID       int64  `db:"patrol_id" json:"patrol_id"`
	PatrolDetailID *int64 `db:"patrol_detail_id" json:"patrol_detail_id"`
	FilePath       string `db:"file_path" json:"file_path"`
	AttachmentType string `db:"attachment_type" json:"attachment_type"`
	IsLiveCapture  bool   `db:"is_live_capture" json:"is_live_capture"`
}

type Alert struct {
	ID        int64      `db:"id" json:"id"`
	PatrolID  int64      `db:"patrol_id" json:"patrol_id"`
	AssetID   int64      `db:"asset_id" json:"asset_id"`
	PICID     int64      `db:"pic_id" json:"pic_id"`
	Message   string     `db:"message" json:"message"`
	IsRead    bool       `db:"is_read" json:"is_read"`
	ResolvedAt *time.Time `db:"resolved_at" json:"resolved_at"`
	CreatedAt time.Time  `db:"created_at" json:"created_at"`
}
