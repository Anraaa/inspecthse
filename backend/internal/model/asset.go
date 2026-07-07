package model

import "time"

type AssetCategory string

const (
	AssetCategoryAPAR       AssetCategory = "APAR"
	AssetCategoryHydrant    AssetCategory = "HYDRANT"
	AssetCategoryFireAlarm  AssetCategory = "FIRE_ALARM"
)

type Asset struct {
	ID            int64         `db:"id" json:"id"`
	Name          string        `db:"name" json:"name"`
	Category      AssetCategory `db:"asset_category" json:"asset_category"`
	SerialNumber  *string       `db:"serial_number" json:"serial_number"`
	LocationID    int64         `db:"location_id" json:"location_id"`
	PICID         *int64        `db:"pic_id" json:"pic_id"`
	SectionID     *int64        `db:"section_id" json:"section_id"`
	Plant         *string       `db:"plant" json:"plant"`
	Size          *string       `db:"size" json:"size"`
	ExpiredAt     *time.Time    `db:"expired_at" json:"expired_at"`
	QRCode        string        `db:"qr_code" json:"qr_code"`
	IsActive      bool          `db:"is_active" json:"is_active"`
	CreatedAt     time.Time     `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time     `db:"updated_at" json:"updated_at"`
}
