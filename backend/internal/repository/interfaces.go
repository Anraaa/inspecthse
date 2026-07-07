package repository

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/model"
)

type UserRepository interface {
	FindByID(ctx context.Context, id int64) (*model.User, error)
	FindByEmail(ctx context.Context, email string) (*model.User, error)
	FindByName(ctx context.Context, name string) (*model.User, error)
	Create(ctx context.Context, user *model.User) error
	Update(ctx context.Context, user *model.User) error
	List(ctx context.Context, offset, limit int) ([]model.User, int, error)
}

type AssetRepository interface {
	FindByID(ctx context.Context, id int64) (*model.Asset, error)
	FindByQRCode(ctx context.Context, qrCode string) (*model.Asset, error)
	FindExpiringAssets(ctx context.Context, withinDays int) ([]model.Asset, error)
	Create(ctx context.Context, asset *model.Asset) error
	Update(ctx context.Context, asset *model.Asset) error
	Delete(ctx context.Context, id int64) error
	List(ctx context.Context, filter map[string]interface{}, offset, limit int) ([]model.Asset, int, error)
}

type LocationRepository interface {
	FindByID(ctx context.Context, id int64) (*model.Location, error)
	FindByQRCode(ctx context.Context, qrCode string) (*model.Location, error)
	FindByName(ctx context.Context, name string) (*model.Location, error)
	Create(ctx context.Context, location *model.Location) error
	Update(ctx context.Context, location *model.Location) error
	Delete(ctx context.Context, id int64) error
	List(ctx context.Context) ([]model.Location, error)
}

type SectionRepository interface {
	FindByID(ctx context.Context, id int64) (*model.Section, error)
	FindByName(ctx context.Context, name string) (*model.Section, error)
	Create(ctx context.Context, section *model.Section) error
	Update(ctx context.Context, section *model.Section) error
	Delete(ctx context.Context, id int64) error
	List(ctx context.Context) ([]model.Section, error)
}

type ShiftRepository interface {
	FindByID(ctx context.Context, id int64) (*model.Shift, error)
	Create(ctx context.Context, shift *model.Shift) error
	Update(ctx context.Context, shift *model.Shift) error
	Delete(ctx context.Context, id int64) error
	List(ctx context.Context) ([]model.Shift, error)
}

type HSEParameterRepository interface {
	FindByID(ctx context.Context, id int64) (*model.HSEParameter, error)
	FindByAssetCategory(ctx context.Context, category model.AssetCategory) ([]model.HSEParameter, error)
	Create(ctx context.Context, param *model.HSEParameter) error
	Update(ctx context.Context, param *model.HSEParameter) error
	Delete(ctx context.Context, id int64) error
	List(ctx context.Context) ([]model.HSEParameter, error)
}

type PatrolRepository interface {
	FindByID(ctx context.Context, id int64) (*model.Patrol, error)
	Create(ctx context.Context, patrol *model.Patrol) (int64, error)
	Update(ctx context.Context, patrol *model.Patrol) error
	List(ctx context.Context, filter map[string]interface{}, offset, limit int) ([]model.Patrol, int, error)
	FindByClientUUID(ctx context.Context, uuid string) (*model.Patrol, error)
}

type PatrolDetailRepository interface {
	CreateBatch(ctx context.Context, details []model.PatrolDetail) error
	Update(ctx context.Context, detail *model.PatrolDetail) error
	ListByPatrolID(ctx context.Context, patrolID int64) ([]model.PatrolDetail, error)
}

type PatrolAttachmentRepository interface {
	Create(ctx context.Context, attachment *model.PatrolAttachment) error
	ListByPatrolID(ctx context.Context, patrolID int64) ([]model.PatrolAttachment, error)
}

type AlertRepository interface {
	Create(ctx context.Context, alert *model.Alert) error
	ListByUserID(ctx context.Context, userID int64) ([]model.Alert, error)
	ListByUserIDWithFilter(ctx context.Context, userID int64, isRead *bool, offset, limit int) ([]model.Alert, int, error)
	UnreadCount(ctx context.Context, userID int64) (int, error)
	MarkAsRead(ctx context.Context, id int64) error
	MarkAllAsRead(ctx context.Context, userID int64) error
}

type ActivityLogRepository interface {
	Create(ctx context.Context, log *model.ActivityLog) error
	List(ctx context.Context, entity string, entityID int64, offset, limit int) ([]model.ActivityLog, int, error)
	ListByUserID(ctx context.Context, userID int64, offset, limit int) ([]model.ActivityLog, int, error)
}

type ExpiringAssetRepository interface {
	FindExpiringAssets(ctx context.Context, withinDays int) ([]model.Asset, error)
}
