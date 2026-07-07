package service

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/model"
)

type AuthService interface {
	Login(ctx context.Context, email, password string) (accessToken, refreshToken string, err error)
	RefreshToken(ctx context.Context, refreshToken string) (newAccessToken, newRefreshToken string, err error)
	Logout(ctx context.Context, userID int64, refreshToken string) error
}

type UserService interface {
	Create(ctx context.Context, user *model.User) error
	Update(ctx context.Context, user *model.User) error
	GetByID(ctx context.Context, id int64) (*model.User, error)
	List(ctx context.Context, offset, limit int) ([]model.User, int, error)
}

type AssetService interface {
	Create(ctx context.Context, asset *model.Asset) error
	Update(ctx context.Context, asset *model.Asset) error
	Delete(ctx context.Context, id int64) error
	GetByID(ctx context.Context, id int64) (*model.Asset, error)
	GetByQRCode(ctx context.Context, qrCode string) (*model.Asset, error)
	List(ctx context.Context, filter map[string]interface{}, offset, limit int) ([]model.Asset, int, error)
	GenerateQRCode(ctx context.Context, assetID int64, baseURL string) ([]byte, error)
}

type LocationService interface {
	Create(ctx context.Context, location *model.Location) error
	Update(ctx context.Context, location *model.Location) error
	Delete(ctx context.Context, id int64) error
	GetByID(ctx context.Context, id int64) (*model.Location, error)
	GetByQRCode(ctx context.Context, qrCode string) (*model.Location, error)
	GenerateQRCode(ctx context.Context, locationID int64, baseURL string) ([]byte, error)
	List(ctx context.Context) ([]model.Location, error)
}

type SectionService interface {
	Create(ctx context.Context, section *model.Section) error
	Update(ctx context.Context, section *model.Section) error
	Delete(ctx context.Context, id int64) error
	GetByID(ctx context.Context, id int64) (*model.Section, error)
	List(ctx context.Context) ([]model.Section, error)
}

type ShiftService interface {
	Create(ctx context.Context, shift *model.Shift) error
	Update(ctx context.Context, shift *model.Shift) error
	Delete(ctx context.Context, id int64) error
	GetByID(ctx context.Context, id int64) (*model.Shift, error)
	List(ctx context.Context) ([]model.Shift, error)
}

type HSEParameterService interface {
	Create(ctx context.Context, param *model.HSEParameter) error
	Update(ctx context.Context, param *model.HSEParameter) error
	Delete(ctx context.Context, id int64) error
	GetByID(ctx context.Context, id int64) (*model.HSEParameter, error)
	GetByAssetCategory(ctx context.Context, category model.AssetCategory) ([]model.HSEParameter, error)
	List(ctx context.Context) ([]model.HSEParameter, error)
}

type PatrolDetailResponse struct {
	Patrol      *model.Patrol          `json:"patrol"`
	Details     []model.PatrolDetail   `json:"details"`
	Attachments []model.PatrolAttachment `json:"attachments"`
}

type PatrolService interface {
	Create(ctx context.Context, patrol *model.Patrol, details []model.PatrolDetail, attachments []model.PatrolAttachment) error
	Submit(ctx context.Context, patrolID int64) error
	Approve(ctx context.Context, patrolID, approvedBy int64) error
	Reject(ctx context.Context, patrolID, rejectedBy int64, reason string) error
	GetByID(ctx context.Context, id int64) (*PatrolDetailResponse, error)
	List(ctx context.Context, filter map[string]interface{}, offset, limit int) ([]model.Patrol, int, error)
	GhostEdit(ctx context.Context, patrolID int64, details []model.PatrolDetail, editedBy int64) error
}

type ExpiredAssetService interface {
	CheckExpiredAssets(ctx context.Context) error
}

type AlertService interface {
	CreateAnomalyAlert(ctx context.Context, patrolID, assetID, picID int64, message string) error
	CreateApprovalAlert(ctx context.Context, patrolID, assetID, userID int64, message string) error
	CreateExpiredAssetAlert(ctx context.Context, assetID, picID int64, message string) error
	ListByUserID(ctx context.Context, userID int64) ([]model.Alert, error)
	ListByUserIDWithFilter(ctx context.Context, userID int64, isRead *bool, offset, limit int) ([]model.Alert, int, error)
	UnreadCount(ctx context.Context, userID int64) (int, error)
	MarkAsRead(ctx context.Context, id int64) error
	MarkAllAsRead(ctx context.Context, userID int64) error
}

type ActivityLogService interface {
	Log(ctx context.Context, userID int64, action, entity string, entityID int64, oldValue, newValue string, isGhost bool) error
	ListByUserID(ctx context.Context, userID int64, offset, limit int) ([]model.ActivityLog, int, error)
}

type ExportService interface {
	ExportChecksheet(ctx context.Context, year int, category model.AssetCategory, locationID, sectionID int64) ([]byte, error)
	ImportAssets(ctx context.Context, file []byte) (*ImportResult, error)
	DownloadImportTemplate(ctx context.Context) ([]byte, error)
}

type ImportResult struct {
	Success int
	Errors  []ImportError
}

type ImportError struct {
	Row    int    `json:"row"`
	Field  string `json:"field"`
	Value  string `json:"value"`
	Error  string `json:"error"`
}

type DashboardService interface {
	GetSuperAdminStats(ctx context.Context) (map[string]interface{}, error)
	GetK3LStats(ctx context.Context, userID int64) (map[string]interface{}, error)
	GetTimHSEStats(ctx context.Context) (map[string]interface{}, error)
}
